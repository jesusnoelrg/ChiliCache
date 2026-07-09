import type { Request, Response } from 'express';
import type { CreateUserDTO, UpdateUserDTO, GetId } from '../types/user.types.ts'
import { generateInsertHelper, updateHelper } from '../utils/sql.utils.ts';
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
      if(!checkUsername.result.success) return res.status(409).json(checkUsername);

      const userData: any = {
        username,
        password,
        full_name
      };

      if(role) userData.role = role;

      const {columns, placeholders} = generateInsertHelper(userData);

      let query = `
        INSERT INTO users
        (${columns})
        VALUES
        (${placeholders});
      `

      db.prepare(query).run(userData);

      res.status(201).json({
        "success": true,
        "message": "¡Usuario creado con éxito!",
        "data": userData
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


  getUsers: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      let query = `
        SELECT 
          id, 
          username, 
          full_name, 
          role 
        FROM users
        LIMIT :limit
        OFFSET :offset
      `

      const params = {
        limit: limit,
        offset: offset
      };

      const stmt = db.prepare(query);
      const result = stmt.all(params);

      if(result.length === 0){
        return res.status(200).json({
          "success": true,
          "message": "No se encontraron usuarios."
        })
      }

      res.json({
        "success": true,
        "meta": {
          "limit": limit,
          "offset": offset,
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

  updateUser: async (req: Request<GetId, {}, UpdateUserDTO>, res: Response) => {
    try {
      const { id } = req.params;
      const {username, password, full_name, role} = req.body;

      if(isNaN(Number(id))){
        return res.status(400).json({
          "success": false,
          "message": "ID inválido."
        })
      }

      const checkId = checkIdExists(id);
      if(!checkId.success) return res.status(404).json(checkId);

      const checkUsername = checkUsernameAvailable(username as string, id as string);
      if(!checkUsername.success) return res.status(409).json(checkUsername);

      const userData: any = {
        id: Number(id)
      }

      if(username) userData.username = username;
      if(password) userData.password = password;
      if(full_name) userData.full_name = full_name;
      if(role) userData.role = role;

      const placeholders = updateHelper(userData);
      let query = `UPDATE users SET ${placeholders} WHERE id = :id`
      let result = db.prepare(query).run(userData);

      return res.status(200).json({
        "success": true,
        "message": `Actualización exitosa${(result.changes === 0) ? '(No se han hecho cambios)' : ''}.`
      })
    }catch(err: any){
      res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
};

const checkIdExists = (id: string): any => {
  if(id !== undefined){
    const validate = db.prepare(`SELECT id FROM users WHERE id = :id`).get({id});

    if(!validate){
      return {
        "success": false,
        "message": `¡El usuario con el (ID: ${id}) no existe!`
      };
    }
  }

  return {
    "succes": true
  }
}

const checkUsernameAvailable = (username: string, id?: string): any => {
  if(!username) return { "success": true };

  let data: any = { username };
  let query = `SELECT username FROM users WHERE username = :username`;

  if(id !== undefined && id){
    query += " AND id != :id";
    data.id = id
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