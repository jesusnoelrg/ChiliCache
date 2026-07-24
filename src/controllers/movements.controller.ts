import type { Request, Response } from 'express';
import { MovementsFilters } from '../types/movement.types';
import { MovementRepository } from '../repositories/movement.repository';

import db from '../config/db'

const repository = new MovementRepository(db);

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

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if(isNaN(limitNumber) || limitNumber < 1) return res.status(400).json({"success": false, "message": "El límite debe ser un número mayor que 0."});
      if(isNaN(offsetNumber)) return res.status(400).json({"success": false, "message": "El offset debe ser un número."});

      const rawOrder = (order as string)?.toUpperCase();
      const sortOrder = rawOrder === 'ASC' ? 'ASC' : 'DESC';

      const filters: any = {
        type: type,
        start_timestamp: start_timestamp,
        end_timestamp: end_timestamp,
        seller_name: seller_name,
        product_name: product_name,
        order: sortOrder,
        limit: limitNumber,
        offset: offsetNumber,
      }

      const result = repository.findAll(filters);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se han encontrado movimientos en el stock."});

      return res.status(200).json({
        "success": true,
        "metadata": {
          "limit": limitNumber,
          "offset": offsetNumber,
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