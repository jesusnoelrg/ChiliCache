import db from "../config/db";
import type { Request, Response } from "express";
import { CreateSaleDTO } from "../types/sale.types";

export const SaleController = {
  createSale: async (req: Request<{}, {}, CreateSaleDTO>, res: Response) => {
    try{
      const { id_client, id_user, invoice, products } = req.body;

      const idClientNumber = Number(id_client);
      const idUserNumber = Number(id_user);

      if(isNaN(idClientNumber) || isNaN(idUserNumber)) return res.status(400).json({"success": false, "message": "ID inválidos."});

      const invoiceNumber = Number(invoice);
      if(isNaN(invoiceNumber)) return res.status(400).json({"success": false, "message": "Debe especificar si hay factura."});

      const selectProduct = db.prepare("SELECT id, price, stock FROM products WHERE id = :id");
      const insertSale = db.prepare("INSERT INTO sales (total, invoice, id_client, id_user) VALUES (:total, :invoice, :id_client, :id_user)");
      const insertDetails = db.prepare("INSERT INTO sales_detail (price, amount, id_sale, id_product) VALUES (:price, :amount, :id_sale, :id_product)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - :amount WHERE id = :id AND stock >= :amount");

      const saleTransaction = db.transaction((productsList, idClientNumber, idUserNumber, invoice) => {
        let totalAcum = 0
        let itemsAdded: any[] = []

        for(const item of productsList){
          const product = selectProduct.get({id: item.id_product});
          if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.id_product}`);

          const total = product.price * item.amount;
          const currentSale = insertSale.run({total, invoice, idClientNumber, idUserNumber});
          const lastIdSale = currentSale.lastInsertRowid;

          insertDetails.run({priceNumber, amountNumber, lastIdSale, idProductNumber});
          updateStock.run({idProductNumber, amountNumber})

          return {
            "success": true,
            "message": "Venta registrada exitosamente.",
            "data": {
              "id_cliente": idClientNumber,
              "id_user": idUserNumber
            }
          }
        }
      })

      return saleTransaction;
    }catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
}