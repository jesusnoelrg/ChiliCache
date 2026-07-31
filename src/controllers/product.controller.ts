import type { Request, Response, NextFunction } from 'express';
import { updateHelper, isUnit } from "../utils/sql.utils";
import { isRecordFieldPresent } from "../utils/db.utils";

import { ProductRepository } from '../repositories/product.repository';

import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilterDTO
} from "../types/product.types";

import db from '../config/db';

const repository = new ProductRepository(db);

export const ProductController = {
  createProduct: async (req: Request<{}, {}, CreateProductDTO>, res: Response, next: NextFunction) => {
    try{
      const { name, unit, net_content, price, stock } = req.body;
      const userId = req.user?.id;

      if(!userId) {
        return res.status(401).json({
          "success": false,
          "message": 'Usuario no autenticado'
        });
      }

      if(!name || !net_content || !price || !stock){
        return res.status(400).json({
          "success": false,
          "message": "¡Faltan campos requeridos!",
          "missing": {
            name: !name,
            net_content: !net_content,
            price: !price,
            stock: !stock
          }
        })
      }

      const contentNumber = Number(net_content);
      const priceNumber = Number(price);
      
      if(isNaN(contentNumber) || 
        isNaN(priceNumber)) return res.status(400).json({ "success": false, "message": "Has ingresado datos tipo cadena en datos númericos."});
      if(priceNumber <= 0) return res.status(400).json({"success": false, "message": "El precio NO debe ser menor o igual a 0."})
      if(contentNumber <= 1)  return res.status(400).json({"success": false, "message": "El contenido neto NO puede ser inferior a 1."})

      const stockNumber: number = Number(stock ?? 0);

      if(isNaN(stockNumber)) return res.status(400).json({"success": false, "message": "El stock debe ser un número valido."});
      if(stockNumber < 0) return res.status(400).json({"success": false, "message": "El stock debe ser un número positivo."});

      const isProductNameUse = repository.findNameWithoutId(name);
      if(isProductNameUse) return res.status(409).json({"success": false, "message": "¡El nombre del producto ya esta en uso!"});

      const productData: CreateProductDTO = {
        name: name,
        unit: unit || undefined,
        net_content: contentNumber,
        price: priceNumber,
        stock: stockNumber
      }

      const result = repository.createWithMovement(productData, userId);

      res.status(201).json({
        "success": true,
        "message": "Producto creado exitosamente.",
        "id_product": result.id_product,
        "movement": result.movement,
        "data": productData
      })
    }catch(err: any){
      if (err.message?.startsWith('USER_NOT_FOUND')) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado." });
      }

      next(err);
    }
  },

  getProductById: async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const product = repository.get(idNumber);
      if(!product) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      res.status(200).json({
        "success": true,
        "data": product
      });
    }catch(err: any){
      next(err);
    }
  },

  getProducts: async (req: Request<{}, {}, {}, ProductFilterDTO>, res: Response, next: NextFunction) => {
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

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if(isNaN(limitNumber) || limitNumber < 1) return res.status(400).json({"success": false, "message": "El límite debe ser un número mayor que 0."});
      if(isNaN(offsetNumber)) return res.status(400).json({"success": false, "message": "El offset debe ser un número."});

      const minStockNumber = Number(minStock || 0);
      const maxStockNumber = Number(maxStock || 2147483646);

      if (isNaN(minStockNumber) || isNaN(maxStockNumber)){
        return res.status(400).json({
          "success": false,
          "message": 'Debes ingresar un número en los campos de stock.'
        });
      }

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
        

      const minContentNumber = Number(minContent || 1);
      const maxContentNumber = Number(maxContent || 2147483646);

      if (isNaN(minContentNumber) || isNaN(maxContentNumber)){
        return res.status(400).json({
          "success": false,
          "message": 'Debes ingresar un número en los campos de contenido neto.'
        });
      }

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

      const minPriceNumber = Number(minPrice || 0);
      const maxPriceNumber = Number(maxPrice || 999999999);

      if (isNaN(minPriceNumber) || isNaN(maxPriceNumber)){
        return res.status(400).json({
          "success": false,
          "message": 'Debes ingresar un número en los campos de precio.'
        });
      }

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

      if(unit && !isUnit(unit)) {
        return res.status(400).json({
          "success": true,
          "message": "Has ingresado un tipo de unidad no valido. Por favor usa ('g', 'kg', 'ml' o 'L')."
        });
      }

      const filters: ProductFilterDTO = {
        name,
        unit,
        minStock: minStockNumber,
        maxStock: maxStockNumber,
        minContent: minContentNumber,
        maxContent: maxContentNumber,
        minPrice: minPriceNumber,
        maxPrice: maxPriceNumber,
        limit: limitNumber,
        offset: offsetNumber,
      }

      const result = repository.findAll(filters);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se encontraron productos."});

      res.status(200).json({
        "success": true,
        "meta": {
          "limit": limitNumber,
          "offset": offsetNumber,
          "count": result.length
        },
        "data": result
      })
    }catch(err: any){
      next(err);
    }
  },

  updateProduct: async(req: Request<any, {}, UpdateProductDTO>, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;
      const { name, unit, net_content, price } = req.body;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const isProductIDExists = repository.isProductExist(idNumber);
      if(!isProductIDExists) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      const productData: any = {}

      if(name) {
        const nameUse = repository.findNameUse(idNumber, name);
        if(nameUse) {
          return res.status(409).json({
            "success": false,
            "message": '¡Ese nombre de producto ya esta en uso!'
          });
        }

        productData.name = name;
      }
      if(unit) {
        if(!isUnit(unit)) {
          return res.status(400).json({
            "success": true,
            "message": "Has ingresado un tipo de unidad no valido. Por favor usa ('g', 'kg', 'ml' o 'L')."
          });
        }

        productData.unit = unit
      };

      if(net_content != null){
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

      if(price != null){
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

      if(Object.keys(productData).length === 0) return res.status(400).json({"success": false, "message": "No se ha introducido por lo menos un valor por modificar."});

      const result = repository.update(idNumber, productData);

      if(!result) {
        return res.status(400).json({
          "success": false,
          "message": `Ha ocurrido un error inesperado al trata de actualizar el producto (ID: ${idNumber}).`
        });
      }

      res.status(200).json({
        "success": true,
        "message": `Actualización exitosa${result.changes === 0 ? ' (No se han hecho cambios)' : ''}.`
      })
    }catch(err: any){
      next(err);
    }
  },

  listProducts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = repository.list();

      return res.status(200).json({
        'data': result
      });
    }catch(err: any){
      next(err);
    }
  },

  toggleProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });
      
      const isActiveNumber = Number(is_active);
      if(isNaN(isActiveNumber) || (isActiveNumber !== 0 && isActiveNumber !== 1)) {
        return res.status(400).json({
          "success": false, 
          "message": "Debes especificar con (0 o 1) para alternar si se activa el producto."})
      }
      

      const product = repository.getIsActive(idNumber);

      if(!product) {
        return res.status(404).json({
          "success": false,
          "message": `El producto con el (ID: ${idNumber}) no existe.`
        });
      }

      const msgToggle = (isActiveNumber === 1) ? 'activado' : 'desactivado';

      if(product.is_active === is_active) {
        return res.status(203).json({
          "success": true,
          "message": `El producto (ID: ${idNumber}) ya se encontraba ${msgToggle}.`
        });
      }

      const result = repository.setIsActive(idNumber, isActiveNumber);

      if(result.changes === 0) {
        res.status(200).json({
          "success": true,
          "message": "El proceso se ha completado pero no ha habido cambios."
        })
      }

      return res.status(200).json({
        "success": true,
        "message": `¡El producto (ID: ${idNumber}) ha sido ${msgToggle}!`
      })
    } catch(err: any){
      next(err);
    }
  },

  deleteProduct: async(req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({ "success": false, "message": "ID inválido." });

      const isProductIDExists = repository.isProductExist(idNumber);
      if(!isProductIDExists) return res.status(404).json({"success": false, "message": "¡Ese producto no existe!"});

      const result = repository.delete(idNumber);

      if(result.changes === 0) return res.status(400).json({"success": false, "message": "No se pudo eliminar el producto."});

      res.status(200).json({
        "success": true,
        "message": "Producto eliminado exitosamente."
      })
    }catch(err: any){
      next(err);
    }
  },

  restockProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const id_user = req.user?.id;

      if(!id_user) {
        return res.status(401).json({
          "success": false,
          "message": "No estás autenticado."
        });
      }

      if(!id || !stock) {
        return res.status(400).json({
          "success": false,
          "message": "¡Faltan campos para realizar la acción!",
          "missing": {
            id_product: !id,
            stock: !stock
          }
        });
      }

      const idProduct = Number(id);

      if(isNaN(idProduct) || !repository.isProductExist(idProduct)) {
        return res.status(400).json({
          "success": false,
          "message": "ID inválido del producto."
        });
      }

      const stockNumber = Number(stock);

      if(isNaN(stockNumber)) {
        return res.status(400).json({
          "success": false,
          "message": "Ingrese un número válido para actualizar el stock."
        });
      }

      if(stockNumber <= 0) {
        return res.status(400).json({
          "success": false,
          "message": "No puede ingresar un nuevo stock menor o igual a 0"
        });
      }

      const result = repository.restockWithMovement(idProduct, id_user, stockNumber);

      return res.status(200).json({
        "success": true,
        "id_product": idProduct,
        "old_stock": result.old_stock,
        "new_stock": result.new_stock,
        "movement": result.movement
      });
    } catch (err: any) {
      next(err);
    }
  }
}