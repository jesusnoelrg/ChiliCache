import db from "../config/db";
import { ProductRow, SaleDetailItem, DataCreateSale, SaleStatus } from "../types/sale.types";

export class SalesRepository {
  private selectProduct = db.prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = :id");
  private insertSale = db.prepare("INSERT INTO sales (total, invoice, id_client, id_user) VALUES (:total, :invoice, :id_client, :id_user)");
  private insertDetails = db.prepare("INSERT INTO sales_detail (price, amount, id_sale, id_product) VALUES (:price, :amount, :id_sale, :id_product)");
  private updateStock = db.prepare("UPDATE products SET stock = stock - :amount WHERE id = :id AND stock >= :amount");
  private insertMovementSale = db.prepare(`
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

        this.insertMovementSale.run({
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

  private selectSaleStatus = db.prepare("SELECT status FROM sales WHERE id = :id");
  private selectCancelProduct = db.prepare("SELECT id_product, amount FROM sales_detail WHERE id_sale = :id");
  private selectStock = db.prepare('SELECT stock FROM products WHERE id = :id_product');
  private updateStockCancel = db.prepare("UPDATE products SET stock = stock + :amount WHERE id = :id");
  private updateSaleStatus =db.prepare("UPDATE sales SET status = 'cancelled' WHERE id = :id");

  public cancelSaleWithMovement(id_sale: number, id_user: number) {
    const transaction = db.transaction(() => {
      const { status } = this.selectSaleStatus.get({ id: id_sale }) as SaleStatus || {};

      if(!status) throw new Error(`SALE_NO_EXIST:${id_sale}`);
      if(status === 'cancelled') throw new Error(`SALE_ALREADY_CANCELLED:${id_sale}`);

      const products = this.selectCancelProduct.all({id: id_sale}) as {id_product: number, amount: number, stock: number}[];

      if(products.length === 0) throw new Error(`EMPTY_PRODUCT_LIST:${id_sale}`);

      for(const {id_product, amount} of products){
        const result = this.updateStockCancel.run({amount: amount, id: id_product});
            
        if (result.changes === 0) throw new Error(`PRODUCT_NOT_FOUND_OR_UPDATE_FAILED:${id_product}:${id_sale}`);

        const { stock }= this.selectStock.get({ id_product: id_product }) as { stock: number } || undefined;
        if(!stock) throw new Error(`PRODUCT_NOT_FOUND:${id_product}:${id_sale}`);

        const new_stock: number = stock + amount;

        this.insertMovementSale.run({
          type: 'cancel',
          old_stock: stock,
          new_stock: new_stock,
          id_product: id_product,
          id_user: id_user
        });
      }

      const result = this.updateSaleStatus.run({id: id_sale});

      if(result.changes === 0) throw new Error(`FAILED_TO_UPDATE_STATUS:${id_sale}`);

      return { "success": true }
    });

    return transaction();
  }
}