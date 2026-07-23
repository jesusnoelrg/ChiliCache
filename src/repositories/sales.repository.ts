import db from "../config/db";
import { ProductRow, SaleDetailItem, DataCreateSale } from "../types/sale.types";

export class SalesRepository {
  private selectProduct = db.prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = :id");
  private insertSale = db.prepare("INSERT INTO sales (total, invoice, id_client, id_user) VALUES (:total, :invoice, :id_client, :id_user)");
  private insertDetails = db.prepare("INSERT INTO sales_detail (price, amount, id_sale, id_product) VALUES (:price, :amount, :id_sale, :id_product)");
  private updateStock = db.prepare("UPDATE products SET stock = stock - :amount WHERE id = :id AND stock >= :amount");
  private insertMovement = db.prepare(`
    INSERT INTO movements (type, old_stock, new_stock, id_product, id_user)
    VALUES (:type, :old_stock, :new_stock, :id_product, :id_user)  
  `);
  
  public createSaleWithMovement (products: SaleDetailItem[], data_sale: DataCreateSale) {
    const transaction = db.transaction(() => {
      let totalAcum: number = 0;
      let itemsAdded: SaleDetailItem[] = [];

      for (const p of products) {
        const product = this.selectProduct.get({id: p.id}) as ProductRow || undefined;
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${product}`);
        if (product.is_active !== 0) throw new Error(`PRODUCT_NOT_AVAILABLE:${p.id}:${p.name}`);

        const total = product.price * p.amount;
        totalAcum += total;

        itemsAdded.push({
          id: p.id,
          name: product.name,
          amount: p.amount,
          price: product.price
        });

        let new_stock: number = product.stock - p.amount;

        this.insertMovement.run({
          type: 'sale',
          old_stock: product.stock,
          new_stock: new_stock,
          id_product: product.id,
          id_user: data_sale.id_user
        });
      }

      const saleRes = this.insertSale.run({
        total: totalAcum, 
        invoice: data_sale.invoice,
        customer_payment: data_sale.customer_payment,
        id_client: data_sale.id_client,
        id_user: data_sale.id_user
      });

      const id_sale: number = saleRes.lastInsertRowid as number;

      for(const item of itemsAdded){
        this.insertDetails.run({
          price: item.price,
          amount: item.amount,
          id_sale: id_sale,
          id_product: item.id
        });

        const stockResult = this.updateStock.run({
          amount: item.amount,
          id: item.id
        });


        if(stockResult.changes === 0) throw new Error(`INSUFFICIENT_STOCK:${item.id}:${item.name}`);
      }

      return { 
        "success": true, 
        "id_sale": id_sale,
        "sale": saleRes
      };
    });

    return transaction();
  }
}