import type { Request, Response } from 'express';
import { MovementsFilters } from '../types/movement.types';

import db from '../config/db';


export const MovementController = {
  getMovements: async (req: Request, res: Response) => {
    try {
      const {
        type,
        start_timestamp, end_timestamp,
        seller_name, product_name,
        limit, offset,
        order
      } = req.query as unknown as MovementsFilters;

      let query = `
      SELECT 
        m.id,
        m.type,
        u.full_name AS seller_name,
        p.name AS product_name,
        m.old_stock,
        m.new_stock,
        m.created_at
      FROM movements AS m
        INNER JOIN users AS u ON u.id = m.id_user
        INNER JOIN products AS p on p.id = m.id_product
      WHERE 1 = 1`;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if(isNaN(limitNumber) || limitNumber < 1) return res.status(400).json({"success": false, "message": "El límite debe ser un número mayor que 0."});
      if(isNaN(offsetNumber)) return res.status(400).json({"success": false, "message": "El offset debe ser un número."});

      const movementData: any = {
        limit: limitNumber,
        offset: offsetNumber,
      }

      if(type) {
        movementData.type = type;
        query += " AND (m.type = :type)";
      }

      if(start_timestamp) {
        movementData.start_timestamp = `${start_timestamp} 00:00:00`;
        query += " AND (m.created_at >= :start_timestamp"
      }

      if(end_timestamp){
        movementData.end_timestamp = `${end_timestamp} 23:59:59`;
        query += " AND (m.created_at <= :end_timestamp)";
      }

      if(seller_name){
        movementData.seller_name = `%${seller_name}%`;
        query += " AND (u.full_name LIKE :seller_name)"
      }
      if(product_name){
        movementData.product_name = `%${product_name}%`;
        query += " AND (p.name LIKE :product_name)"
      }

      if(order === 'desc') {
        query += " ORDER BY m.created_at DESC"
      }

      query += " LIMIT :limit OFFSET :offset";

      const result = db.prepare(query).all(movementData);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se han encontrado movimientos en el stock."});

      return res.status(200).json({
        "success": true,
        "metadata": {
          "limit:": movementData.limit,
          "offset": movementData.offset,
          "count": result.length
        },
        "data": result
      })
    } catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
}