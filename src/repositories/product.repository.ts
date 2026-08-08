import type { Database, Statement } from 'better-sqlite3';
import db from '../config/db';

import { updateHelper } from '../utils/sql.utils';
import { CreateProductDTO, ListProduct, SelectStockById, ProductFilterDTO, UpdateProductDTO, Product } from '../types/product.types';
import { CreateMovement } from '../types/movement.types';

export class ProductRepository {
  private selectIdUser: Statement<[{id_user: number}], {id: number}>;
  private selectProductById: Statement<[{id: number}], Product>;
  private selectProductId: Statement<[{id: number}], {id: number}>;
  private selectIsActiveById: Statement<[{id: number}], {id: number, is_active: 0 | 1}>;
  private selectStockById: Statement<[{id_product: number}], {id: number, stock: number}>;
  private selectNameWithoutId: Statement<[{name: string}], {name: string}>;
  private selectNameUse: Statement<[{name: string, id: number}], {name:string}>;
  
  private listProducts: Statement<[], ListProduct>;

  private insertProduct: Statement;
  private insertMovement: Statement;

  private deleteProductById: Statement;

  private updateIsActive: Statement;
  private updateRestock: Statement;

  constructor(private db: Database) {
    this.selectIdUser = db.prepare('SELECT id FROM users WHERE id = :id_user');
    this.selectProductById = db.prepare("SELECT * FROM products WHERE id = :id");
    this.selectProductId = db.prepare('SELECT id FROM products WHERE id = :id');
    this.selectNameWithoutId = db.prepare('SELECT name FROM products WHERE name = :name');
    this.selectNameUse = db.prepare('SELECT name FROM products WHERE name = :name AND id != :id');
    this.selectIsActiveById = db.prepare("SELECT id, is_active FROM products WHERE id = :id");
    this.selectStockById = db.prepare('SELECT id, stock FROM products WHERE id = :id_product');
    this.listProducts = db.prepare('SELECT id, name, price, stock FROM products');
    this.insertProduct = db.prepare(`
    INSERT INTO products 
    (name, unit, net_content, price, stock) 
    VALUES 
    (:name, :unit, :net_content, :price, :stock)`);
    this.insertMovement = db.prepare(`
    INSERT INTO movements 
    (type, old_stock, new_stock, id_product, id_user) VALUES
    (:type, :old_stock, :new_stock, :id_product, :id_user)
    `);
    this.deleteProductById = db.prepare("DELETE FROM products WHERE id = :id");
    this.updateIsActive = db.prepare("UPDATE products SET is_active = :is_active WHERE id = :id");
    this.updateRestock = db.prepare('UPDATE products SET stock = stock + :stock WHERE id = :id_product');
  }

  public findNameUse(id: number, name: string): { name: string } | null {
    return this.selectNameUse.get({ name, id }) ?? null;
  }

  public findNameWithoutId(name: string): { name: string } | null {
    return this.selectNameWithoutId.get({ name }) ?? null;
  }

  public get(id: number): Product | null {
    return this.selectProductById.get({ id }) ?? null;
  }

  public isProductExist(id: number): { id: number } | null {
    return this.selectProductId.get({ id }) ?? null;
  }

  public delete(id: number) {
    return this.deleteProductById.run({ id });
  }

  public list(): ListProduct[] {
    return this.listProducts.all();
  }

  public setIsActive(id: number, is_active: 0 | 1) {
    return this.updateIsActive.run({id, is_active});
  }

  public getIsActive(id: number): { id: number, is_active: 0 | 1 } | null {
    return this.selectIsActiveById.get({ id }) ?? null;
  }

  public update(id: number, values: UpdateProductDTO) {
    return db.prepare(`UPDATE products SET ${updateHelper(values)} WHERE id = :id`)
    .run({ id });
  }

  public findAll(filters: ProductFilterDTO) {
    const conditions: string[] = [];
    const params: Record<string, any> = {
      limit: filters.limit,
      offset: filters.offset,
      orderBy: filters.orderBy || 'asc'
    };

    if(filters.name) {
      params.name = `%${filters.name}%`
      conditions.push('name LIKE :name')
    }

    if(filters.unit) {
      params.unit = filters.unit;
      conditions.push('unit = :unit')
    }

    if (filters.minStock !== undefined) {
      conditions.push("stock >= :minStock");
      params.minStock = filters.minStock;
    }

    if (filters.maxStock !== undefined) {
      conditions.push("stock <= :maxStock");
      params.maxStock = filters.maxStock;
    }

    if (filters.minPrice !== undefined) {
      conditions.push("price >= :minPrice");
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice !== undefined) {
      conditions.push("price <= :maxPrice");
      params.maxPrice = filters.maxPrice;
    }

    const whereClause = conditions.length > 0 
    ? ` WHERE ${conditions.join(' AND ')}` : '';

    const query = `SELECT * FROM products${whereClause} ORDER BY id :orderBy LIMIT :limit OFFSET :offset`;

    return db.prepare(query).all(params);
  }

  public createWithMovement(productData: CreateProductDTO, userId: number) {
    const transaction = db.transaction(() => {
      const id_user = this.selectIdUser.get({ id_user: userId }) as { id: number } || undefined;
      if (!id_user) throw new Error(`USER_NOT_FOUND:${userId}`);

      const product = this.insertProduct.run(productData);
      if (!product) throw new Error(`PRODUCT_ERROR_CREATED`);

      const id_product = product.lastInsertRowid as number;

      const movementData: CreateMovement = {
        type: 'created',
        old_stock: 0,
        new_stock: productData.stock,
        id_product: id_product,
        id_user: id_user.id
      };

      const movement = this.insertMovement.run(movementData);

      return {
        'id_product': id_product,
        'movement': movement
      }
    }) as any;

    return transaction();
  }

  public restockWithMovement (id_product: number, id_user: number, stock: number) {
    const transaction = db.transaction(() => {
      const product = this.selectStockById.get({ id_product: id_product }) as SelectStockById || undefined;
      if(!product) throw new Error(`PRODUCT_NOT_FOUND:${id_product}`);

      this.updateRestock.run({ stock: stock, id_product: id_product });

      const old_stock = product.stock;
      const new_stock = Number(product.stock) + stock;

      const movement = this.insertMovement.run({
        type: 'restock',
        old_stock: old_stock,
        new_stock: new_stock,
        id_product: id_product,
        id_user: id_user
      });

      return {
        'old_stock': old_stock,
        'new_stock': new_stock,
        'movement': {
          'id_movement': movement.lastInsertRowid,
          ...movement
        }
      }
    });

    return transaction();
  }
}