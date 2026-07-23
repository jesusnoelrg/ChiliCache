import db from "../config/db";
import { SalesRepository } from "../repositories/sales.repository";
import type { Request, Response } from "express";
import { 
  CreateSaleDTO, 
  GetSalesDTO, 
  ProductRow, 
  FiltersSaleReport,
  DataSaleReport, 
  SaleReportItem } from "../types/sale.types";
import { isRecordFieldPresent } from "../utils/db.utils";

import { generatePdfReportHandler } from '../utils/pdf.utils';

export const SaleController = {
  createSale: async (req: Request<{}, {}, CreateSaleDTO>, res: Response) => {
    try{
      const { id_client, invoice, customer_payment, products } = req.body;
      const idUserNumber = req.user?.id;

      if(!idUserNumber){
        return res.status(401).json({
          "success": false,
          "message": "Usuario no identificado en la sesión."
        })
      }

      if(!products) {
        return res.status(400).json({
          "success": false,
          "message": "No se han establecido productos para realizar la venta."
        })
      }

      const idClientNumber = Number(id_client);

      if(isNaN(idClientNumber) || !idClientNumber) return res.status(400).json({"success": false, "message": "ID del cliente inválido."});

      const invoiceNumber = Number(invoice);
      if(isNaN(invoiceNumber) || (invoice !== 0 && invoice !== 1)) return res.status(400).json({"success": false, "message": "Debe especificar si hay factura."});

      const paymentNumber = Number(customer_payment);
      if(isNaN(paymentNumber) || !customer_payment) return res.status(400).json({"success": false, "message": "¡Debe especificar el pago del cliente!"});

      const isUserExist = isRecordFieldPresent({table: "users", column: "id", value: idUserNumber});
      if(!isUserExist) return res.status(404).json({"success": false, "message": `El usuario con el (ID: ${idUserNumber}) no existe.`});
      
      const isClientExist = isRecordFieldPresent({table: "clients", column: "id", value: idClientNumber});
      if(!isClientExist) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idUserNumber}) no existe.`});

      const dataTransaction: DataCreateSale = {
        id_client: idClientNumber,
        id_user: idUserNumber,
        invoice: invoiceNumber,
        customer_payment: paymentNumber
      }

      const result = salesRepository.createSaleWithMovement(products, dataTransaction)

      if(!result.success){
        return res.status(400).json({
          "success": false,
            "message": "Ha ocurrido un error en la transación."
        });
      }

      return res.status(200).json({
        "success": true,
        "message": "¡Venta registrada exitosamente!",
        "id_sale": result.id_sale,
        "sale": result.sale
      });
    }catch(err: any){
      console.log("Error: " + err);

      if(err.message.startsWith('PRODUCT_NOT_FOUND')){
        const productId = err.message.split(':')[1]
        return res.status(404).json({
          "success": false,
          "message": `El producto con el (ID: ${productId}) no existe.`
        });
      }

      if(err.message.startsWith('PRODUCT_NOT_AVAILABLE')) {
        const p = err.message.split(':');
        return res.status(400).json({
          "success": false,
          "message": `El producto ${p[2]} (ID: ${p[1]}) se encuentra deshabilitado para la venta.`
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
        status,
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
          s.status,
          s.total,
          s.customer_payment,
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
        query += ' AND invoice = :invoice';
      }
      if(status){
        queryData.status = status;
        query += " AND s.status = :status";
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
          s.status,
          s.total,
          s.customer_payment,
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
      const idUserNumber = req.user?.id;

      if(!idUserNumber){
        return res.status(401).json({
          "success": false,
          "message": "Usuario no identificado en la sesión."
        })
      }

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const result = salesRepository.cancelSaleWithMovement(idNumber, idUserNumber);

      if(!result.success){
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
  },

  generateReportPDF: async (req: Request<{}, {}, {}, FiltersSaleReport>, res: Response) => {
    try {
      const { 
        start_timestamp, end_timestamp,
        client_name, seller_name,
        invoice
      } = req.query;

      if(!start_timestamp || !end_timestamp) {
        return res.status(400).json({
          "success": false,
          "message": "¡Debe ingresar una fecha de inicio y de fin para poder generar un reporte"
        });
      }

      let saleData: any = {
        start_timestamp: `${start_timestamp} 00:00:00`,
        end_timestamp: `${end_timestamp} 23:59:59`
      }

      let dataSale = {
        start_date: start_timestamp,
        end_date: end_timestamp
      } as DataSaleReport;

      let query = `
        SELECT
          s.id,
          c.name AS client_name,
          u.full_name AS seller_name,
          s.total,
          CASE
            WHEN s.invoice = 1 THEN 'Sí'
            ELSE 'No'
          END AS invoice,
          s.date
        FROM sales AS s
          INNER JOIN users AS u ON u.id = s.id_user
          INNER JOIN clients AS c ON c.id = s.id_client
        WHERE (s.date >= :start_timestamp AND s.date <= :end_timestamp) AND (s.status = 'completed')
      `;

      
      if(client_name && client_name !== undefined) {
        saleData.client_name = `%${client_name}%`;
        dataSale.client_name = client_name;
        query += ' AND (c.name LIKE :client_name)';
      }

      if(seller_name && seller_name !== undefined) {
        saleData.seller_name = `%${seller_name}`;
        dataSale.seller_name = seller_name;
        query += ' AND (u.full_name LIKE :seller_name)';
      }

      if(invoice && invoice !== undefined) {
        const invoiceNumber = Number(invoice);

        if(isNaN(invoiceNumber)) {
          return res.status(400).json({
            "success": false,
            "message": "Debes ingresar (1 o 0) para obtener el tipo de facturación."
          });
        }

        saleData.invoice = invoice;
        query += ' AND (s.invoice = :invoice)';
      }

      const result = db.prepare(query).all(saleData) as SaleReportItem[];

      dataSale.data = result;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="reporte_${start_timestamp}_${end_timestamp}.pdf"`);

      generatePdfReportHandler(dataSale, res);
    } catch (err: any) {
      console.log(err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      });
    }
  }
}