import type {Request, Response} from 'express';
import { generateInsertHelper } from "../utils/sql.utils";

import {
  CreateProductoDTO
} from "../types/product.types";

import db from '../config/db';

export const ProductController = {
  createProduct: async (req: Request<{}, {}, CreateProductoDTO>, res: Response) => {
    try{
      const { name, unit, net_content, price, stock } = req.body;

      if(!name || !net_content || !price){
        return res.status(400).json({
          "success": false,
          "message": "¡Faltan campos requeridos!",
          "missing": {
            name: !name,
            net_content: !net_content,
            price: !price
          }
        })
      }

      console.log(name)

      const contentNumber = Number(net_content);
      const priceNumber = Number(price);
      

      if(isNaN(contentNumber) || 
        isNaN(priceNumber)) return res.status(400).json({ "success": false, "message": "Has ingresado datos tipo cadena en datos númericos."});

      const checkName = checkNameUsed(name as string);
      if(!checkName.success) return res.status(409).json(checkName);

      const productData: any = {
        name: name,
        net_content: contentNumber,
        price: priceNumber,
      }

      if(unit !== undefined) productData.unit = unit;
      if(stock !== undefined){
        const stockNumber = Number(stock);

        if(isNaN(stockNumber)) return res.status(400).json({"success": false, "message": "El stock debe ser un número valido."});
        if(stockNumber < 0) return res.status(400).json({"success": false, "message": "El stock debe ser un número positivo."});

        productData.stock = stockNumber;
      }

      const { columns, placeholders } = generateInsertHelper(productData);

      const result = db.prepare(`INSERT INTO products (${columns}) VALUES (${placeholders})`).run(productData);

      if(result.changes === 0){
        return res.status(400).json({
          "success": false,
          "message": "No se pudo crear el producto."
        });
      }

      res.status(201).json({
        "success": true,
        "message": "Producto creado exitosamente.",
        "data": productData
      })
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
}

const checkNameUsed = (name: string) => {
  if(name){
    const validate = db.prepare("SELECT name FROM products WHERE name = :name").get({name});

    if(validate){
      return {
        "success": false,
        "message": "¡El nombre del producto ya esta en uso!"
      };
    }
  }

  return { "success": true };
}