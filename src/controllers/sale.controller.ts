import db from "../config/db";

import type { Request, Response, NextFunction } from "express";
import { 
  CreateSaleDTO, 
  GetSalesDTO, 
  FiltersSaleReport,
  DataSaleReport,
  DataCreateSale,
  SaleReportItem,
  SaleStatus } from "../types/sale.types";

import { generatePdfReportHandler } from '../utils/pdf.utils';
import { SalesRepository } from "../repositories/sales.repository";
import { UserRepository } from '../repositories/user.repository';
import { ClientRepository } from '../repositories/client.repository';

const salesRepository = new SalesRepository(db);
const userRepositroy = new UserRepository(db);
const clientRepository = new ClientRepository(db);

export const SaleController = {
  createSale: async (req: Request<{}, {}, CreateSaleDTO>, res: Response, next: NextFunction) => {
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
      if(!customer_payment || isNaN(paymentNumber)) return res.status(400).json({"success": false, "message": "¡Debe especificar el pago del cliente!"});

      const isUserExist = userRepositroy.isExist(idUserNumber);
      if(isUserExist == null) return res.status(404).json({"success": false, "message": `El usuario con el (ID: ${idUserNumber}) no existe.`});
      
      const isClientExist = clientRepository.isExist(idClientNumber);
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

      next(err);
    }
  },

  getSales: async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { 
        seller_name,
        client_name,
        start_timestamp, end_timestamp,
        min_total, max_total,
        invoice,
        status,
        limit,
        offset,
        orderBy
      } = req.query;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      if(isNaN(limitNumber) || limitNumber < 1) return res.status(400).json({"success": false, "message": "El límite debe ser un número mayor que 0."});
      if(isNaN(offsetNumber)) return res.status(400).json({"success": false, "message": "El offset debe ser un número."});
      if(orderBy && !['asc', 'desc'].includes(orderBy.toString().toLowerCase())) return res.status(400).json({"success": false, "message": "El orden debe ser 'asc' o 'desc'."});

      const filters: GetSalesDTO = {
        limit: limitNumber,
        offset: offsetNumber,
        orderBy: orderBy ? (orderBy.toString().toLowerCase() as 'asc' | 'desc') : 'asc'
      };

      if (seller_name) {
        filters.seller_name = `%${(seller_name as string).trim()}%`;
      }
      if (client_name) {
        filters.client_name = `%${(client_name as string).trim()}%`;
      }

      if (invoice != null) {
        const invoiceNumber = Number(invoice);
        if(invoiceNumber !== 0 && invoiceNumber !== 1) {
          return res.status(400).json({
            "success": false,
            "message": '¡Debe especificar con el formato correcto para obtener la factura!'
          });
        }

        filters.invoice = invoiceNumber;
      }

      if (status != null) {
        if (!['completed', 'cancelled'].includes(status.toString().toLowerCase())) {
          return res.status(400).json({
            "success": false,
            "message": "El estado debe ser 'completed' o 'cancelled'."
          });
        }
        filters.status = status as SaleStatus;
      }

      if (start_timestamp != null) {
        filters.start_timestamp = `${start_timestamp} 00:00:00`;
      }
      if (end_timestamp != null) {
        filters.end_timestamp = `${end_timestamp} 23:59:59`;
      }

      if (min_total != null && min_total !== '') {
        const min = Number(min_total);
        if (isNaN(min)) {
          return res.status(400).json({
            "success": false,
            "message": "Debes ingresar un número en los campos de total."
          });
        }

        if (min < 0) {
          return res.status(400).json({
            "success": false,
            "message": "El total mínimo no puede ser menor que 0."
          });
        }

        filters.min_total = min;
      }

      if (max_total != null && max_total !== '') {
        const max = Number(max_total);
        if (isNaN(max)) {
          return res.status(400).json({
            "success": false,
            "message": "Debes ingresar un número en los campos de total."
          });
        }

        if (max < 0) {
          return res.status(400).json({
            "success": false,
            "message": "El total máximo no puede ser menor que 0."
          });
        }

        filters.max_total = max;
      }

      if (filters.min_total !== undefined && filters.max_total !== undefined) {
        if (filters.min_total > filters.max_total) {
          return res.status(400).json({
            "success": false,
            "message": "El total mínimo no puede ser mayor que el total máximo."
          });
        }
      }

      const result = salesRepository.findAll(filters);

      if(result.length === 0) return res.status(200).json({"success": true, "message": "No se han encontrado ventas."});

      return res.status(200).json({
        "success": true,
        "metadata": {
          "limit": filters.limit,
          "offset": filters.offset,
          "count": result.length
        },
        "data": result
      })
    }catch(err: any){
      next(err);
    }
  },

  getSaleById: async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const { success, sale, products } = salesRepository.get(idNumber);

      if(!success){
        return res.status(400).json({
          "success": false,
          "message": "Ha ocurrido un error al obtener la venta."
        });
      }

      return res.status(200).json({
        "success": true,
        "data": {
          ...sale,
          "products": products
        }
      })
    }catch(err: any){
      next(err);
    }
  },

  cancelSaleById: async (req: Request, res: Response, next: NextFunction) => {
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

      next(err);
    }
  },

  generateReportPDF: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        start_timestamp, end_timestamp,
        client_name, seller_name,
        invoice
      } = req.query as unknown as FiltersSaleReport;

      if(!start_timestamp || !end_timestamp) {
        return res.status(400).json({
          "success": false,
          "message": "¡Debe ingresar una fecha de inicio y de fin para poder generar un reporte"
        });
      }

      const start_timestamp_formatted = `${start_timestamp} 00:00:00`;
      const end_timestamp_formatted = `${end_timestamp} 23:59:59`;

      const reportData = {
        start_date: start_timestamp_formatted,
        end_date: end_timestamp_formatted
      } as DataSaleReport;

      if(client_name != null && client_name.trim() !== '') {
        reportData.client_name = client_name as string;
      }

      if(seller_name != null && seller_name.trim() !== '') {
        reportData.seller_name = seller_name as string;
      }

      const invoiceNumber = Number(invoice);

      if(isNaN(invoiceNumber)) {
        return res.status(400).json({
          "success": false,
          "message": "Debes ingresar (1 o 0) para obtener el tipo de facturación."
        });
      }

      if(invoiceNumber !== 0 && invoiceNumber !== 1) {
        return res.status(400).json({
          "success": false,
          "message": "Debes ingresar (1 o 0) para obtener el tipo de facturación."
        });
      }

      const result = salesRepository.reportSale({
        start_timestamp: start_timestamp_formatted,
        end_timestamp: end_timestamp_formatted,
        client_name,
        seller_name,
        invoice: invoiceNumber
      });

      reportData.data = result as SaleReportItem[];

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="reporte_${start_timestamp}_${end_timestamp}.pdf"`);

      generatePdfReportHandler(reportData, res);
    } catch (err: any) {
      next(err);
    }
  }
}