import type { Database, Statement } from 'better-sqlite3';
import { 
  ProductRow, 
  SaleDetailItem, 
  DataCreateSale, 
  SaleStatus, 
  GetSalesDTO, 
  Sale,
  FiltersSaleReport,
  DataSaleReport
} from "../types/sale.types";

export class SalesRepository {
  private selectSaleById: Statement<[{id: number}], Sale | undefined>;
  private selectSaleDetailsById: Statement<[{id: number}], SaleDetailItem[]>;
  private selectProduct: Statement<[{id: number}], ProductRow>;
  private selectSaleStatus: Statement<[{id: number}], { status: SaleStatus } | undefined>;
  private selectCancelProduct: Statement<[{id: number}], {id_product: number, amount: number}>;
  private selectStock: Statement<[{id_product: number}], {stock: number} | undefined>;
  
  private insertSale: Statement<[{total: number, invoice: number, customer_payment: number, id_client: number, id_user: number}], {lastInsertRowid: number} | undefined>;
  private insertDetails: Statement<[{price: number, amount: number, id_sale: number, id_product: number}], {changes: number} | undefined>;
  private insertMovementSale: Statement<[{type: 'sale' | 'cancel', old_stock: number, new_stock: number, id_product: number, id_user: number}], {changes: number} | undefined>;

  private updateStock: Statement<[{amount: number, id: number}], {changes: number} | undefined>;
  private updateStockCancel: Statement<[{amount: number, id: number}], {changes: number} | undefined>;
  private updateSaleStatus: Statement<[{id: number}], {changes: number} | undefined>;

  constructor(private db: Database) {
    this.selectSaleById = db.prepare(`
      SELECT
        s.id,
        s.id_user,
        id_client,
        u.full_name AS seller_name,
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
    `);
    this.selectSaleDetailsById = db.prepare(`
      SELECT
        sd.id_product AS id_product,
        p.name AS product_name,
        sd.price AS price,
        sd.amount AS amount
      FROM sales_detail AS sd
        INNER JOIN products AS p ON p.id = sd.id_product
      WHERE sd.id_sale = :id
    `);
    this.selectProduct = db.prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = :id");
    this.selectSaleStatus = db.prepare("SELECT status FROM sales WHERE id = :id");
    this.selectCancelProduct = db.prepare("SELECT id_product, amount FROM sales_detail WHERE id_sale = :id");
    this.selectStock = db.prepare('SELECT stock FROM products WHERE id = :id_product');
    this.insertSale = db.prepare("INSERT INTO sales (total, invoice, customer_payment, id_client, id_user) VALUES (:total, :invoice, :customer_payment, :id_client, :id_user)");
    this.insertDetails = db.prepare("INSERT INTO sales_detail (price, amount, id_sale, id_product) VALUES (:price, :amount, :id_sale, :id_product)");
    this.insertMovementSale = db.prepare(`
    INSERT INTO movements (type, old_stock, new_stock, id_product, id_user)
    VALUES (:type, :old_stock, :new_stock, :id_product, :id_user)  
    `);
    this.updateStock = db.prepare("UPDATE products SET stock = stock - :amount WHERE id = :id AND stock >= :amount");
    this.updateStockCancel = db.prepare("UPDATE products SET stock = stock + :amount WHERE id = :id");
    this.updateSaleStatus = db.prepare("UPDATE sales SET status = 'cancelled' WHERE id = :id");
  }
  
  public createSaleWithMovement (products: SaleDetailItem[], data_sale: DataCreateSale) {
    const transaction = this.db.transaction(() => {
      let totalAcum: number = 0;
      let itemsAdded: SaleDetailItem[] = [];

      for (const p of products) {
        const product = this.selectProduct.get({id: p.id}) ?? null;
        if (product == null) throw new Error(`PRODUCT_NOT_FOUND:${product}`);
        if (product.is_active !== 1) throw new Error(`PRODUCT_NOT_AVAILABLE:${p.id}:${p.name}`);

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
        "sale": {
          total: totalAcum, 
          invoice: data_sale.invoice,
          customer_payment: data_sale.customer_payment,
          id_client: data_sale.id_client,
          id_user: data_sale.id_user
        }
      };
    });

    return transaction();
  }

  public cancelSaleWithMovement(id_sale: number, id_user: number) {
    const transaction = this.db.transaction(() => {
      const sale = this.selectSaleStatus.get({ id: id_sale }) ?? null;

      if(!sale) throw new Error(`SALE_NO_EXIST:${id_sale}`);
      if(sale.status === 'cancelled') throw new Error(`SALE_ALREADY_CANCELLED:${id_sale}`);

      const products = this.selectCancelProduct.all({id: id_sale}) as {id_product: number, amount: number}[];

      if(products.length === 0) throw new Error(`EMPTY_PRODUCT_LIST:${id_sale}`);

      for(const {id_product, amount} of products){
        const { stock }= this.selectStock.get({ id_product: id_product }) as { stock: number } || undefined;
        if(!stock) throw new Error(`PRODUCT_NOT_FOUND:${id_product}:${id_sale}`);

        const result = this.updateStockCancel.run({amount: amount, id: id_product});
        if (result.changes === 0) throw new Error(`PRODUCT_NOT_FOUND_OR_UPDATE_FAILED:${id_product}:${id_sale}`);

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

  public get(id: number) {
    const sale = this.selectSaleById.get({id: id}) ?? null;

    if(!sale) throw new Error(`SALE_NOT_FOUND:${id}`);

    const details = this.selectSaleDetailsById.all({id: id}) as SaleDetailItem[][];

    if(details.length === 0) throw new Error(`EMPTY_PRODUCT_LIST:${id}`);

    return {
      "success": true,
      "sale": sale,
      "products": details
    };
  }

  public findAll(filters: GetSalesDTO) {
    const params: Record<string, any> = {};
    const conditions: string[] = [];

    if (filters.seller_name) {
      conditions.push('u.username LIKE :seller_name');
      params.seller_name = filters.seller_name;
    }

    if (filters.client_name) {
      conditions.push('c.name LIKE :client_name');
      params.client_name = filters.client_name;
    }

    if (filters.start_timestamp) { 
      conditions.push('s.date >= :start_timestamp')
      params.start_timestamp = filters.start_timestamp;
    }

    if (filters.end_timestamp) {
      conditions.push('s.date <= :end_timestamp')
      params.end_timestamp = filters.end_timestamp;
    }

    if (filters.invoice) {
      conditions.push('s.invoice = :invoice')
      params.invoice = filters.invoice;
    }

    if (filters.status) {
      conditions.push('s.status = :status')
      params.status = filters.status;
    }

    if (filters.min_total) {
      conditions.push('s.total >= :min_total')
      params.min_total = filters.min_total;
    }

    if (filters.max_total) {
      conditions.push('s.total <= :max_total')
      params.max_total = filters.max_total;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
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
    ${whereClause}
    ORDER BY s.date ${filters.orderBy ?? 'ASC'}
    LIMIT :limit OFFSET :offset
    `;

    return this.db.prepare(query).all(params);
  }

  public reportSale(filters: FiltersSaleReport) {
    const params: Record<string, any> = {};
    const conditions: string[] = [];

    if (filters.client_name) {
      conditions.push('c.name LIKE :client_name');
      params.client_name = filters.client_name;
    }

    if (filters.seller_name) {
      conditions.push('u.full_name LIKE :seller_name');
      params.seller_name = filters.seller_name;
    }

    if (filters.invoice != null && filters.invoice !== Number.NaN) {
      conditions.push('s.invoice = :invoice');
      params.invoice = filters.invoice;
    }

    const query = `
      SELECT
        s.id,
        c.name AS client_name,
        u.full_name AS seller_name,
        s.total,
        s.customer_payment,
        CASE
          WHEN s.invoice = 1 THEN 'Sí'
          ELSE 'No'
        END AS invoice,
        s.date
      FROM sales AS s
        INNER JOIN clients AS c ON c.id = s.id_client
        INNER JOIN users AS u ON u.id = s.id_user
      WHERE (s.date >= :start_date AND s.date <= :end_date) AND (s.status = 'completed')
      ${conditions.length > 0 ? ` AND (${conditions.join(' AND ')})` : ''}
      ORDER BY s.date ASC
    `;

    return this.db.prepare(query).all(params);
  }
}