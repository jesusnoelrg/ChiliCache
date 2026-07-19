import db from "../config/db";
import type { Request, Response } from "express";
import { CreateSaleDTO, GetSalesDTO, ProductRow } from "../types/sale.types";
import { isRecordFieldPresent } from "../utils/db.utils";

export const SaleController = {
  createSale: async (req: Request<{}, {}, CreateSaleDTO>, res: Response) => {
    try{
      const { id_client, invoice, products } = req.body;
      const idUserNumber = req.user?.id;

      if(!idUserNumber){
        return res.status(404).json({
          "success": false,
          "message": "Usuario no identificado en la sesión."
        })
      }

      const idClientNumber = Number(id_client);

      if(isNaN(idClientNumber)) return res.status(400).json({"success": false, "message": "ID del cliente inválido."});

      const invoiceNumber = Number(invoice);
      if(isNaN(invoiceNumber)) return res.status(400).json({"success": false, "message": "Debe especificar si hay factura."});

      const isUserExist = isRecordFieldPresent({table: "users", column: "id", value: idUserNumber});
      if(!isUserExist) return res.status(404).json({"success": false, "message": `El usuario con el (ID: ${idUserNumber}) no existe.`})
      
        const isClientExist = isRecordFieldPresent({table: "clients", column: "id", value: idClientNumber});
      if(!isClientExist) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idUserNumber}) no existe.`})

      const selectProduct = db.prepare("SELECT id, name, price, stock FROM products WHERE id = :id");
      const insertSale = db.prepare("INSERT INTO sales (total, invoice, id_client, id_user) VALUES (:total, :invoice, :id_client, :id_user)");
      const insertDetails = db.prepare("INSERT INTO sales_detail (price, amount, id_sale, id_product) VALUES (:price, :amount, :id_sale, :id_product)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - :amount WHERE id = :id AND stock >= :amount");

      const saleTransaction = db.transaction((productsList, idClientNumber, idUserNumber, invoice) => {
        let totalAcum: number = 0;
        let itemsAdded: any[] = [];

        for(const item of productsList){
          const product = selectProduct.get({id: item.id}) as ProductRow || undefined;
          if (!product) throw new Error(`PRODUCT_NOT_FOUND:${product}`);

          const total = product.price * item.quantity;
          totalAcum += total;

          itemsAdded.push({
            id: item.id,
            name: product.name,
            amount: item.quantity,
            price: product.price
          });
        }

        const saleResult = insertSale.run({
          total: totalAcum, 
          invoice: invoice,
          id_client: idClientNumber,
          id_user: idUserNumber
        });
        
        const saleResultId = saleResult.lastInsertRowid;

        for(const item of itemsAdded){
          insertDetails.run({
            price: item.price,
            amount: item.amount,
            id_sale: saleResultId,
            id_product: item.id
          });

          const stockResult = updateStock.run({
            amount: item.amount,
            id: item.id
          });

          console.log(stockResult.changes)

          if(stockResult.changes === 0) throw new Error(`INSUFFICIENT_STOCK:${item.id}:${item.name}`);
        }

        return { "success": true, saleResultId };
      })

      try{
        const saleId = saleTransaction(products, idClientNumber, idUserNumber, invoice);

        if(!saleId.success){
          return res.status(400).json({
            "success": false,
            "message": "Ha ocurrido un error en la transación."
          });
        }

        return res.status(200).json({
          "success": true,
          "message": "¡Venta registrada exitosamente!",
          "id_venta": saleId.saleResultId
        });
      }catch(err: any){
        if(err.message.startsWith('PRODUCT_NOT_FOUND')){
          const productId = err.message.split(':')[1]
          return res.status(404).json({
            "success": true,
            "message": `El producto con el (ID: ${productId}) no existe.`
          });
        }

        if(err.message.startsWith('INSUFFICIENT_STOCK')){
          const product = err.message.split(':');
          return res.status(400).json({
            "success": false,
            "message": `Inventario insuficiente para el producto '${product[2]}' (ID: ${product[1]})`
          })
        }

        return res.status(500).json({
          "success": false,
          "message": "Error interno al procesar la transacción en la base de datos."
        })
      }
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  getSales: async (req: Request<{}, {}, {}, GetSalesDTO>, res: Response) => {
    try{
      const { 
        seller_name,
        client_name,
        start_timestamp, end_timestamp,
        min_total, max_total,
        invoice,
        limit,
        offset 
      } = req.query;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      let query = `
        SELECT
          s.id,
          u.full_name AS seller_name,
          c.name AS client_name,
          s.total,
          s.invoice,
          s.date
        FROM sales AS s
          INNER JOIN users AS u ON u.id = s.id_user
          INNER JOIN clients AS c ON c.id = s.id_client
        WHERE 1 = 1
      `;

      const queryData: any = {
        limit: limitNumber,
        offset: offsetNumber
      };

      if(seller_name){
        queryData.seller_name = `%${seller_name}%`;
        query += " AND u.username LIKE :seller_name"
      }
      if(client_name){
        queryData.client_name = `%${client_name}%`;
        query += " AND c.name LIKE :client_name"
      }
      if(start_timestamp){
        queryData.start_timestamp = `${start_timestamp} 00:00:00`;
        query += " AND s.date >= :start_timestamp";
      }
      if(end_timestamp){
        queryData.end_timestamp = `${end_timestamp} 23:59:59`;
        query += " AND s.date <= :end_timestamp";
      }
      if(invoice){
        const invoiceNumber = Number(invoice);
        if(invoiceNumber !== 0 && invoiceNumber !== 1) {
          return res.status(400).json({
            "success": false,
            "message": '¡Debe especificar con el formato correcto para obtener la factura!'
          });
        }

        queryData.invoice = invoiceNumber;
        query += ' AND invoice = :invoice'
      }

      if(min_total || max_total) {
        let min = Number(min_total || 0);
        const max = Number(max_total || 2147483646);
        
        if (isNaN(min) || isNaN(max)){
          return res.status(400).json({
            "success": false,
            "message": 'Debes ingresar un número en los campos de total.'
          });
        }

        if(min < 0) min = 0;

        if(max > 2147483647) {
          return res.status(400).json({
            "success": false,
            "message": 'El total máximo excede el límite permitido por el sistema.'
          });
        }

        if(min > max) {
          return res.status(400).json({
            "success": false,
            "message": 'El total minimo no puede superar al total máximo.'
          });
        }

        queryData.min_total = min;
        queryData.max_total = max;
        query += 'AND (total >= :min_total AND total <= :max_total)'
      }
      
      query += " LIMIT :limit OFFSET :offset";

      const result = db.prepare(query).all(queryData);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se han encontrado ventas."});

      return res.status(200).json({
        "success": true,
        "metadata": {
          "limit:": queryData.limit,
          "offset": queryData.offset,
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

  getSaleById: async (req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const sale = db.prepare(`
        SELECT
          s.id AS id_venta,
          s.id_user,
          id_client,
          u.full_name AS op_name,
          c.name AS client_name,
          s.total,
          s.invoice,
          s.date
        FROM sales AS s
          INNER JOIN clients AS c ON c.id = s.id_client
          INNER JOIN users AS u ON u.id = s.id_user
        WHERE s.id = :id
        `).get({id: idNumber});

      if(!sale) return res.status(404).json({"success": false, "message": `La venta con el (ID: ${idNumber}) no existe.`});

      const productResults = db.prepare(`
        SELECT
          sd.id_product AS id_product,
          p.name AS product_name,
          sd.price AS price,
          sd.amount AS amount
        FROM sales_detail AS sd
          INNER JOIN products AS p ON p.id = sd.id_product
        WHERE sd.id_sale = :id
      `).all({id: idNumber});

      if(!productResults || productResults.length === 0){
        return res.status(404).json({
          "success": false,
          "message": "¡No hay productos por mostrar!"
        });
      }

      return res.status(200).json({
        "success": true,
        "data": {
          ...(sale as any),
          "products": productResults
        }
      })
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      });
    }
  },

  cancelSaleById: async (req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const stmtSale = db.prepare("SELECT status FROM sales WHERE id = :id");
      const stmtProducts = db.prepare("SELECT id_product, amount FROM sales_detail WHERE id_sale = :id");
      const stmtUpdateStock = db.prepare("UPDATE products SET stock = stock + :amount WHERE id = :id");
      const stmtUpdateStatus = db.prepare("UPDATE sales SET status = 'cancelled' WHERE id = :id");

      const transaction = db.transaction((idNumber) => {
        const { status } = stmtSale.get({id: idNumber}) as {status: 'cancelled' | 'completed'} || {};

        if(!status) throw new Error(`SALE_NO_EXIST:${idNumber}`);
        if(status === 'cancelled') throw new Error(`SALE_ALREADY_CANCELLED:${idNumber}`);

        const products = stmtProducts.all({id: idNumber}) as {id_product: number, amount: number}[];

        if(products.length === 0) throw new Error(`EMPTY_PRODUCT_LIST:${idNumber}`);

        for(const {id_product, amount} of products){
          const result = stmtUpdateStock.run({amount: amount, id: id_product});
          
          if (result.changes === 0) {
            throw new Error(`PRODUCT_NOT_FOUND_OR_UPDATE_FAILED:${id_product}:${idNumber}`);
          }
        }

        const statusResult = stmtUpdateStatus.run({id: idNumber});

        if (statusResult.changes === 0) {
          throw new Error(`FAILED_TO_UPDATE_STATUS:${idNumber}`);
        }

        return {"success": true}
      });

      const confirmTransaction = transaction(idNumber);

      if(!confirmTransaction.success){
        return res.status(400).json({
          "success": false,
          "message": "Ha ocurrido un error en la transación."
        });
      }

      return res.status(200).json({
        "success": true,
        "message": "Venta cancelada exitosamente."
      })
    }catch(err: any){
      if(err.message.startsWith('SALE_NO_EXIST')){
        return res.status(404).json({
          "success": false, 
          "message": `La venta con el (ID: ${err.message.split(':')[1]}) no existe`
        });
      }

      if(err.message.startsWith('SALE_ALREADY_CANCELLED')){
        return res.status(400).json({
          "success": false, 
          "message": `La venta con el (ID: ${err.message.split(':')[1]}) ya se encuentra cancelada.`
        });
      }

      if(err.message.startsWith('EMPTY_PRODUCT_LIST')){
        return res.status(404).json({
          "success": false, 
          "message": `La venta con el (ID: ${err.message.split(':')[1]}) no tiene productos registrados.`
        });
      }

      if(err.message.startsWith('FAILED_TO_UPDATE_STATUS')){
        return res.status(400).json({
          "success": false, 
          "message": `Hubo un fallo al querer actualizar el estado de la venta (ID: ${err.message.split(':')[1]}).`
        });
      } 

      if(err.message.startsWith('PRODUCT_NOT_FOUND_OR_UPDATE_FAILED')){
        const msg = err.message.split(':');
        return res.status(400).json({
          "success": false, 
          "message": `Hubo un fallo al querer actualizar el stock del producto (ID: ${msg[1]} venta (ID: ${msg[2]})).`
        });
      }

      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      });
    }
  }
}