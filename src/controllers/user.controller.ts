import { response, type Request, type Response } from 'express';
import type { 
  LoginUser, 
  CreateUserDTO, 
  GetUsersDTO, 
  UpdateUserDTO, 
  UserRole, 
  SessionUser } from '../types/user.types.ts'
import { generateInsertHelper, updateHelper } from '../utils/sql.utils.ts';
import { isRecordFieldPresent } from '../utils/db.utils'
import { hashPassword, verifyPassword } from '../utils/auth.utils.ts';
import { isAuthenticated, logout } from '../middlewares/auth.middleware.ts'

import { randomUUID } from 'crypto';
import redisClient from '../config/redis.ts';
import db from '../config/db.ts';

export const UserController = {
  // Request<Params, ResBody, Body, Query>
  createUser: async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
    try {
      const { username, password, full_name, role } = req.body;

      if(!username || !password || !full_name){
        return res.status(400).json({
          "success": false,
          "message": "Faltan campos requeridos.",
          "missing": {
            username: !username,
            password: !password,
            full_name: !full_name
          }
        })
      }

      let checkUsername = checkUsernameAvailable(username as string);
      if(!checkUsername.success) return res.status(409).json(checkUsername);

      const encryptedPassword = await hashPassword(password);
      const userData: any = {
        username,
        full_name,
        password: encryptedPassword,
        role: role || 'seller'
      };

      const {columns, placeholders} = generateInsertHelper(userData);

      let query = `
        INSERT INTO users
        (${columns})
        VALUES
        (${placeholders});
      `
      const result = db.prepare(query).run(userData);
      delete userData.password;

      res.status(201).json({
        "success": true,
        "message": "¡Usuario creado con éxito!",
        "data": {id: result.lastInsertRowid, ...userData}
      });

    }catch(err: any){
      //Debug
      console.log(err);
      res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  getUsers: async (req: Request<{}, {}, {}, GetUsersDTO>, res: Response) => {
    try {
      const { username, full_name, role, limit, offset } = req.query;

      let query = `
        SELECT 
          id, 
          username, 
          full_name, 
          role 
        FROM users
        WHERE 1 = 1
      `

      const userData: any = {
        limit: Number(limit || 10),
        offset: Number(offset || 0)
      };

      if(username){
        userData.username = `%${username}%`;
        query += " AND username LIKE :username";
      }

      if(full_name){
        userData.full_name = `%${full_name}%`;
        query += " AND full_name LIKE :full_name";
      }

      if(role){
        userData.role = role;
        query += " AND role = :role";
      }

      query += " LIMIT :limit OFFSET :offset";

      const result = db.prepare(query).all(userData);

      if(result.length === 0){
        return res.status(200).json({
          "success": true,
          "message": "No se encontraron usuarios."
        })
      }

      res.json({
        "success": true,
        "meta": {
          "limit": userData.limit,
          "offset": userData.offset,
          "count": result.length
        },
        "data": result
      })
    }catch(err: any){
      //Debug
      console.log(err);
      res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  getUserById: async (req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const result = db.prepare("SELECT username, password, full_name, role, created_at FROM users WHERE id = :id").get({id: idNumber});

      if(!result) return res.status(404).json({ "success": false, "message": "Usuario no encontrado." });

      res.status(200).json({ "success": true, "data": result })
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERRROR 500] Error en la base de datos."
      });
    }
  },

  updateUser: async (req: Request<any, {}, UpdateUserDTO>, res: Response) => {
    try {
      const { id } = req.params;
      const {username, password, old_password, full_name, role} = req.body;

      const idNumber = Number(id);

      if(isNaN(idNumber)){
        return res.status(400).json({
          "success": false,
          "message": "ID inválido."
        })
      }

      const checkId = isRecordFieldPresent({table: "users", column: "id", value: idNumber});
      if(!checkId) {
        return res.status(404).json({
          "success": false,
          "message": `¡El usuario con el (ID: ${idNumber}) no existe!`
        });
      }

      const currentUser = req.user;
      console.log(currentUser?.id);
      if(currentUser?.role !== 'admin' && currentUser?.id !== idNumber){
        return res.status(403).json({
          "success": false,
          "message": "¡No tienes permisos para editar a otros usuarios!"
        });
      }

      const checkUsername = checkUsernameAvailable(username as string, idNumber);
      if(!checkUsername.success) return res.status(409).json(checkUsername);

      const userData: any = {
        id: idNumber
      }

      if(username) userData.username = username;
      if(password) {
        if(currentUser?.role === 'seller'){
          if(!old_password){
            return res.status(400).json({
              "success": false,
              "message": "Por favor, proporciona tu antigua contraseña."
            });
          }

          
          const hashOldPsw = db.prepare('SELECT password FROM users WHERE id = :id').get({id: id}) as any;
          
          if(!hashOldPsw){
            return res.status(404).json({
              "success": false,
              "message": "El usuario solicitado no existe o fue dado de baja."
            });
          }

          const resultPsw = await verifyPassword(old_password, hashOldPsw.password as string)

          if(!resultPsw){
            return res.status(400).json({
              "success": false,
              "message": "¡La contraseña que has ingresado no coincide con la antigua!"
            });
          }
        }

        const encryptedPassword = await hashPassword(password);
        userData.password = encryptedPassword;
      };
      if(full_name) userData.full_name = full_name;
      if(role) userData.role = role;

      const placeholders = updateHelper(userData, ['id', 'created_at']);
      let query = `UPDATE users SET ${placeholders} WHERE id = :id`
      let result = db.prepare(query).run(userData);

      let successMsg = "";

      if(password && old_password){
        successMsg = "¡Has cambiado tu contraseña exitosamente!";
      } else {
        successMsg = `Actualización exitosa${(result.changes === 0) ? '(No se han hecho cambios)' : ''}.`
      }

      return res.status(200).json({
        "success": true,
        "message": successMsg
      })
    }catch(err: any){
      res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try{
      const { id } = req.params;
      const idNumber = Number(id);

      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const checkId = isRecordFieldPresent({table: "users", column: "id", value: idNumber});
      if(!checkId) {
        return res.status(404).json({
          "success": false,
          "message": `¡El usuario con el (ID: ${idNumber}) no existe!`
        });
      }

      //TODO: Logic to verify that the user does not delete himself

      const checkRoleAdmin = db.prepare(`SELECT role FROM users WHERE id = :id`).get({id: idNumber}) as UserRole || undefined;

      if(checkRoleAdmin && checkRoleAdmin.role === 'admin') {
        return res.status(403).json({
          "success": false,
          "message": "¡No puedes eliminar a un Administrador!"
        });
      }

      const result = db.prepare("DELETE FROM users WHERE id = :id").run({id: idNumber});

      if(result.changes === 0){
        return res.status(400).json({
          "success": true,
          "message": "No se ha podido eliminar al usuario."
        });
      }

      res.status(200).json({
        "success": true,
        "message": "¡Usuario eliminado exitosamente!"
      })
    }catch(err: any){
      console.error(err);

      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(409).json({
          success: false,
          message: "No se puede eliminar el usuario porque tiene historial de ventas o registros asociados en el sistema."
        });
      }

      return res.status(500).json({ success: false, message: "[ERROR 500]: Error en la base de datos." });
    }
  },

  loginUser: async (req: Request<{}, {}, LoginUser>, res: Response) => {
    try{
      const { username, password } = req.body;

      if(!username || !password || typeof username !== 'string' || typeof password !== 'string'){
        return res.status(400).json({
          "success": false,
          "message": "¡Campo inválidos o vacíos!"
        })
      }

      const query = "SELECT id, username, password, role, full_name FROM users WHERE username = :username"
      const user = db.prepare(query).get({username: username}) as SessionUser;
      if(!user){
        return res.status(401).json({
          "success": false,
          "message": "¡Credenciales incorrectas!"
        });
      }

      const hashedPassword = user.password;
      if(!hashedPassword) {
        return res.status(404).json({
          "success": false,
          "message": "¡Credenciales incorrectas!"
        });
      }

      const verifyPsw = await verifyPassword(password, hashedPassword);

      if(!verifyPsw){
        return res.status(404).json({
          "success": false,
          "message": "¡Credenciales incorrectas!"
        });
      }

      const uuid = crypto.randomUUID();

      const sessionData: any = {
        uuid: uuid,
        id: user.id,
        username: user.username,
        role: user.role
      }

      await redisClient.set(`session:${uuid}`, JSON.stringify(sessionData),
        {EX: 7200}
      );

      res.cookie('sid', uuid, {
        httpOnly: true,
        secure: false,
        maxAge: 7200 * 1000
      })

      return res.status(200).json({
        "success": true,
        "message": "¡Inicio de sesión exitoso!",
        "user": {
          "id": user.id,
          "username": user.username,
          "full_name": user.full_name,
          "role": user.role
        }
      });
    }catch(err: any){
      console.error(err);
      return res.status(500).json({ success: false, message: "[ERROR 500]: Error en la base de datos." });
    }
  }
};

const checkUsernameAvailable = (username: string, id?: number): Record<string, any> => {
  if(!username) return { "success": true };

  let data: any = { username };
  let query = `SELECT username FROM users WHERE username = :username`;

  if(id !== undefined && id){
    query += " AND id != :id";
    data.id = id;
  }

  const validate = db.prepare(query).get(data);

  if(validate){
    return {
      "success": false,
      "message": "¡Ese nombre de usuario ya esta en uso!"
    };
  }

  return { "success": true};
}  