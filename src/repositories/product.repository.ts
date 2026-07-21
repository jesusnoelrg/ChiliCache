import db from '../config/db';
import { CreateProductDTO } from '../types/product.types';

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
}