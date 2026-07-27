import { Database, Statement } from 'better-sqlite3';
import { MovementsFilters } from '../types/movement.types';

export class MovementRepository {
  private selectMovements: Statement;

  constructor(private db: Database) {
    this.selectMovements = db.prepare(`
      SELECT 
        m.id,
        m.type,
        u.full_name AS seller_name,
        p.name AS product_name,
        m.old_stock,
        m.new_stock,
        m.created_at
      FROM movements AS m
        INNER JOIN users AS u ON u.id = m.id_user
        INNER JOIN products AS p on p.id = m.id_product
      WHERE
        (:type IS NULL OR m.type = :type)
        AND (:start_timestamp IS NULL OR m.created_at >= :start_timestamp)
        AND (:end_timestamp IS NULL OR m.created_at <= :start_timestamp)
        AND (:seller_name IS NULL OR u.full_name LIKE :seller_name)
        AND (:product_name IS NULL OR p.name LIKE :product_name)
      ORDER BY
        CASE WHEN :order = 'ASC' THEN m.created_at END ASC,
        CASE WHEN :order = 'DESC' THEN m.created_at END DESC
      LIMIT :limit OFFSET :offset
      `);
  }

  public findAll(filters: MovementsFilters) {
    const params: MovementsFilters = {
      type: filters.type ?? null,
      start_timestamp: filters.start_timestamp ? `${filters.start_timestamp} 00:00:00` : null,
      end_timestamp:  filters.end_timestamp ? `${filters.end_timestamp} 23:59:59` : null,
      seller_name: filters.seller_name ? `%${filters.seller_name}%` : null,
      product_name: filters.product_name ? `%${filters.product_name}%` : null,
      order: filters.order,
      limit: filters.limit,
      offset: filters.offset
    }

    return this.selectMovements.all(params);
  }
}