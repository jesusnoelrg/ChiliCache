import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import redisClient from '../config/redis.ts';
import db from '../config/db.ts';

import type { 
  LoginUser,
  UserLogged,
  CreateUserDTO, 
  GetUsersDTO, 
  UpdateUserDTO, UpdateUserRepositoryParams,
  UserRole, 
  SessionUser } from '../types/user.types.ts'

import { UserRepository } from '../repositories/user.repository.ts';
import { updateHelper } from '../utils/sql.utils.ts';
import { isRecordFieldPresent } from '../utils/db.utils'
import { hashPassword, verifyPassword } from '../utils/auth.utils.ts';

const userRepository = new UserRepository(db);

export const UserController = {
  createUser: async (req: Request<{}, {}, CreateUserDTO>, res: Response, next: NextFunction) => {
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

      const checkUsername = userRepository.checkUsername(username);
      if(checkUsername !== null) return res.status(409).json(checkUsername);

      const encryptedPassword = await hashPassword(password);
      const userData: CreateUserDTO = {
        username,
        full_name,
        password: encryptedPassword,
        role: role || 'seller'
      };

      const result = userRepository.createUser(userData);

      res.status(201).json({
        success: true,
        message: "¡Usuario creado con éxito!",
        data: {
          id: result.lastInsertRowid,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role
        }
      });

    }catch(err: any){
      next(err);
    }
  },

  getUsers: async (req: Request<{}, {}, {}, GetUsersDTO>, res: Response, next: NextFunction) => {
    try {
      const { username, full_name, role, limit, offset } = req.query;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if (isNaN(limitNumber) || limitNumber < 1) {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'limit' debe ser un número entero mayor a 0."
        });
      }

      if (isNaN(offsetNumber) || offsetNumber < 0) {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'offset' debe ser un número entero mayor o igual a 0."
        });
      }

      if(role && !['seller', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Solo se admiten los roles 'seller' y 'admin' en el sistema."
        });
      }

      const filters: GetUsersDTO = {
        username,
        full_name,
        role,
        limit: limitNumber,
        offset: offsetNumber
      };

      const result = userRepository.findAll(filters);

      res.json({
        success: true,
        meta: {
          limit: limitNumber,
          offset: offsetNumber,
          count: result.length
        },
        data: result
      })
    }catch(err: any){
      next(err);
    }
  },

  getUsersName: async (req: Request, res:Response, next: NextFunction) => {
    try {
       const result = userRepository.getAllNames() as { full_name: string }[];
       const names = result.map(n => n.full_name);

       return res.status(200).json({success: true, names});
    } catch(err: any) {
      next(err);
    }
  },

  getUserById: async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)){
        return res.status(400).json({
          success: false,
          message: "ID inválido."
        });
      }

      const result = userRepository.getById(idNumber);

      if(!result){
        return res.status(404).json({ 
          success: false,
          message: "Usuario no encontrado." }
        );
      }

      res.status(200).json({ success: true, data: result });
    }catch(err: any){
      next(err);
    }
  },

  updateUser: async (req: Request<{ id: string }, {}, UpdateUserDTO>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {username, password, old_password, full_name, role} = req.body;

      const idNumber: number = Number(id);

      if (isNaN(idNumber)){
        return res.status(400).json({
          success: false,
          message: "ID inválido."
        })
      }

      const currentUser: UserLogged | undefined = req.user;

      if (currentUser?.role !== 'admin' && currentUser?.id !== idNumber){
        return res.status(403).json({
          success: false,
          message: "¡No tienes permisos para editar a otros usuarios!"
        });
      }

      const checkId = userRepository.getById(idNumber) as { id: number, username: string} | null;
      if (!checkId) {
        return res.status(404).json({
          success: false,
          message: `¡El usuario con el (ID: ${idNumber}) no existe!`
        });
      }

      if (role && currentUser?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para editar el rol de un usuario."
        })
      }

      if (username) {
        if (username.length < 3 || username.length > 30) {
          return res.status(400).json({
            success: false,
            message: "Solo se permiten entre 3 y 30 caracteres en el nombre de usuario."
          });
        }

        if (userRepository.checkUsername(username, idNumber)) {
          return res.status(409).json({
            success: false,
            message: "¡Ese nombre de usuario ya se encuentra en uso!"
          });
        }
      }

      if (full_name && (full_name.length < 3 || full_name.length > 80)){
        return res.status(400).json({
          success: false,
          message: "Solo se permiten entre 3 y 80 caracteres en el nombre completo."
        });
      }

      if (role && !['seller', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Solo se admiten los roles 'seller' y 'admin' en el sistema."
        });
      }

      let encryptedPassword: string | undefined = undefined;

      if(password) {
        if(currentUser?.role === 'seller'){
          if(!old_password){
            return res.status(400).json({
              success: false,
              message: "Por favor, proporciona tu antigua contraseña."
            });
          }

          const hashOldPsw = userRepository.getPassword(idNumber) as string | null;
          
          if(!hashOldPsw){
            return res.status(404).json({
              success: false,
              message: "El usuario solicitado no existe o fue dado de baja."
            });
          }

          const resultPsw = await verifyPassword(old_password, hashOldPsw);

          if(!resultPsw){
            return res.status(400).json({
              success: false,
              message: "¡La contraseña que has ingresado no coincide con la antigua!"
            });
          }
        }

        encryptedPassword = await hashPassword(password) as string;
      };

      const data: UpdateUserRepositoryParams = {
        id: idNumber,
        username,
        password: encryptedPassword,
        full_name,
        role: currentUser?.role === 'admin' ? role : undefined
      }

      let result = userRepository.update(data);
      
      const successMsg = (password && old_password)
      ? "¡Has cambiado tu contraseña exitosamente!"
      : `Actualización exitosa${result.changes === 0 ? ' (No se realizaron cambios)' : ''}.`;

      return res.status(200).json({
        success: true,
        message: successMsg
      })
    }catch(err: any){
      next(err);
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
        full_name: user.full_name,
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