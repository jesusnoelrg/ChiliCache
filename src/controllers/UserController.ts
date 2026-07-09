import type { Request, Response } from 'express';
import db from '../config/db.ts';

export const UserController = {
  getUsers: async (req: Request, res: Response) => {
    try {
      const limit= parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      let stmt = `
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

      const statement = db.prepare(stmt);
      const result = statement.all(params);

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
  }
};