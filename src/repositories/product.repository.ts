import db from '../config/db';
import { 
  CreateProductDTO,
  SelectStockById,
  CreateMovement,
  TypeMovement
 } from '../types/product.types';

export class ProductRepository {
  private selectIdUser = db.prepare('SELECT id FROM users WHERE id = :id_user');
  private insertProduct = db.prepare(`
    INSERT INTO products 
    (name, unit, net_content, price, stock) 
    VALUES 
    (:name, :unit, :net_content, :price, :stock)`);
  private insertMovement = db.prepare(`
    INSERT INTO movements 
    (type, old_stock, new_stock, id_product, id_user) VALUES
    (:type, :old_stock, :new_stock, :id_product, :id_user)
  `);

  public createWithMovement(productData: CreateProductDTO, userId?: number) {
    const transaction = db.transaction(() => {
      const id_user = this.selectIdUser.get({ id_user: userId }) as { id: number } || undefined;
      if (!id_user) throw new Error(`USER_NOT_FOUND:${userId}`);

      const product = this.insertProduct.run(productData);
      if (!product) throw new Error(`PRODUCT_ERROR_CREATED`);

      const id_product = product.lastInsertRowid;

      const movementData: any = {
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

  private selectStockById = db.prepare('SELECT id, stock FROM products WHERE id = :id_product');
  private updateRestock = db.prepare('UPDATE products SET stock = stock + :stock WHERE id = :id_product');

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

  public selectProductById = db.prepare("SELECT * FROM products WHERE id = :id");
  public listProducts = db.prepare('SELECT id, name, price, stock FROM products');
  public deleteProductById = db.prepare("DELETE FROM products WHERE id = :id")
}