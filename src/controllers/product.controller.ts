import type {Request, Response} from 'express';
import { generateInsertHelper, updateHelper } from "../utils/sql.utils";
import { isRecordFieldPresent } from "../utils/db.utils";

import {
  CreateProductDTO,
  UpdateProductDTO,
  GetProductsDTO
} from "../types/product.types";

import db from '../config/db';

export const ProductController = {
  createProduct: async (req: Request<{}, {}, CreateProductDTO>, res: Response) => {
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
      if(priceNumber <= 0) return res.status(400).json({"success": false, "message": "El precio NO debe ser menor o igual a 0."})
      if(contentNumber <= 1)  return res.status(400).json({"success": false, "message": "El contenido neto NO puede ser inferior a 1."})

      const isProductNameUse = isRecordFieldPresent({table: "products", column: "name", value: name});
      if(isProductNameUse) return res.status(409).json({"success": false, "message": "¡El nombre del producto ya esta en uso!"});

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
  },

  getProductById: async (req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const product = db.prepare("SELECT * FROM products WHERE id = :id").get({id: idNumber});

      if(!product) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      res.status(200).json({
        "success": true,
        "data": product
      });
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  getProducts: async (req: Request<{}, {}, {}, GetProductsDTO>, res: Response) => {
    try{
      const { 
        name,
        unit, 
        minStock, maxStock, 
        minContent, maxContent,
        minPrice, maxPrice,
        limit, 
        offset 
      } = req.query;

      let query = `SELECT * FROM products WHERE 1 = 1`;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if(isNaN(limitNumber) || limitNumber < 1) return res.status(400).json({"success": false, "message": "El límite debe ser un número mayor que 0."});
      if(isNaN(offsetNumber)) return res.status(400).json({"success": false, "message": "El offset debe ser un número."});

      const productData: any = {
        limit: limitNumber,
        offset: offsetNumber,
      }

      if(name !== undefined){
        productData.name = `%${name}%`;
        query += " AND name LIKE :name";
      }

      if(unit !== undefined){
        productData.unit = unit;
        query += " AND unit = :unit";
      }

      if(minStock !== undefined || maxStock !== undefined) {
        let minStockNumber = Number(minStock || 0);
        const maxStockNumber = Number(maxStock || 2147483646);

        if (isNaN(minStockNumber) || isNaN(maxStockNumber)){
          return res.status(400).json({
            "success": false,
            "message": 'Debes ingresar un número en los campos de stock.'
          });
        }

        if(minStockNumber < 0) minStockNumber = 0;

        if(minStockNumber > maxStockNumber) {
          return res.status(400).json({
            "success": false,
            "message": 'El stock minimo no puede superar al stock máximo.'
          });
        }

        if(maxStockNumber > 2147483647) {
          return res.status(400).json({
            "success": false,
            "message": 'El stock máximo excede el límite permitido por el sistema.'
          });
        }

        productData.minStock = minStockNumber;
        productData.maxStock = maxStockNumber;
        query += ' AND (stock >= :minStock AND stock <= :maxStock)'
      }

      if(minContent !== undefined || maxContent !== undefined) {
        let minContentNumber = Number(minContent || 1);
        const maxContentNumber = Number(maxContent || 2147483646);

        if (isNaN(minContentNumber) || isNaN(maxContentNumber)){
          return res.status(400).json({
            "success": false,
            "message": 'Debes ingresar un número en los campos de contenido neto.'
          });
        }

        if(minContentNumber < 0) minContentNumber = 0;

        if(minContentNumber > maxContentNumber) {
          return res.status(400).json({
            "success": false,
            "message": 'El contenido neto minimo no puede superar al contenido máximo.'
          });
        }

        if(maxContentNumber > 2147483647) {
          return res.status(400).json({
            "success": false,
            "message": 'El contenido máximo excede el límite permitido por el sistema.'
          });
        }

        if(unit === undefined) {
          productData.unit = 'ml';
          query += ' AND (unit = :unit)';
        }

        productData.minContent = minContentNumber;
        productData.maxContent = maxContentNumber;
        query += ' AND (net_content >= :minContent AND net_content <= :maxContent)';
      }

      if(minPrice !== undefined || maxPrice !== undefined) {
        let minPriceNumber = Number(minPrice || 0);
        const maxPriceNumber = Number(maxPrice || 999999999);

        if (isNaN(minPriceNumber) || isNaN(maxPriceNumber)){
          return res.status(400).json({
            "success": false,
            "message": 'Debes ingresar un número en los campos de precio.'
          });
        }

        if(minPriceNumber < 0) minPriceNumber = 0;

        if(minPriceNumber > maxPriceNumber) {
          return res.status(400).json({
            "success": false,
            "message": 'El precio minimo no puede superar al precio máximo.'
          });
        }

        if(maxPriceNumber > 2147483647) {
          return res.status(400).json({
            "success": false,
            "message": 'El precio máximo excede el límite permitido por el sistema.'
          });
        }

        productData.minPrice = minPriceNumber;
        productData.maxPrice = maxPriceNumber;
        query += ' AND (price >= :minPrice AND price <= :maxPrice)'
      }

      query += " LIMIT :limit OFFSET :offset";

      const result = db.prepare(query).all(productData);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se encontraron productos."});

      res.status(200).json({
        "success": true,
        "meta": {
          "limit": productData.limit,
          "offset": productData.offset,
          "count": result.length
        },
        "data": result
      })
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  updateProduct: async(req: Request<any, {}, UpdateProductDTO>, res: Response) => {
    try{
      const { id } = req.params;
      const { name, unit, net_content, price } = req.body;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const isProductIDExists = isRecordFieldPresent({table: "products", column: "id", value: idNumber});
      if(!isProductIDExists) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      const productData: any = { id: idNumber }

      if(name !== undefined && name !== '') productData.name = name;
      if(unit !== undefined) productData.unit = unit;
      if(net_content !== undefined){
        const contentNumber = Number(net_content);
        if(isNaN(contentNumber)) return res.status(400).json({"success": false, "message": "El valor del contenido neto debe ser un número."});
        if(contentNumber <= 0) {
          return res.status(400).json({
            "success": false,
            "message": 'El contenido neto NO puede ser menor o igual a 0.'
          });
        }
        
        productData.net_content = contentNumber;
      }
      if(price !== undefined){
        const priceNumber = Number(price);
        if(isNaN(priceNumber)) return res.status(400).json({"success": false, "message": "El precio del producto debe ser un número."});
        if(priceNumber <= 0) {
          return res.status(400).json({
            "success": false,
            "message": 'El precio NO puede ser menor o igual a 0.'
          });
        }
        productData.price = priceNumber;
      }

      if(Object.keys(productData).length < 2) return res.status(400).json({"success": false, "message": "No se ha introducido por lo menos un valor por modificar."});

      const set_clause = updateHelper(productData, ['id', 'created_at']);
      const query = `UPDATE products SET ${set_clause} WHERE id = :id`;

      const result = db.prepare(query).run(productData);

      res.status(200).json({
        "success": true,
        "message": `Actualización exitosa${result.changes === 0 ? ' (No se han hecho cambios)' : ''}.`
      })
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  deleteProduct: async(req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const isProductIDExists = isRecordFieldPresent({table: "products", column: "id", value: idNumber});
      if(!isProductIDExists) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      const result = db.prepare("DELETE FROM products WHERE id = :id").run({id: idNumber});

      if(result.changes === 0) return res.status(400).json({"success": false, "message": "No se pudo eliminar el producto."});

      res.status(200).json({
        "success": true,
        "message": "Producto eliminado exitosamente."
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