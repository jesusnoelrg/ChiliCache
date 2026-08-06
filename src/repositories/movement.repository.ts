import { Database } from 'better-sqlite3';
import { MovementsFilters } from '../types/movement.types';

export class MovementRepository {
  constructor(private db: Database) {}

  public findAll(filters: MovementsFilters) {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.type) {
      conditions.push('m.type = :type');
      params.type = filters.type;
    }

    if (filters.start_timestamp) {
      conditions.push('m.created_at >= :start_timestamp');
      params.start_timestamp = `${filters.start_timestamp} 00:00:00`;
    }

    if (filters.end_timestamp) {
      conditions.push('m.created_at <= :end_timestamp');
      params.end_timestamp = `${filters.end_timestamp} 23:59:59`;
    }

    if (filters.seller_name) {
      conditions.push('u.full_name LIKE :seller_name');
      params.seller_name = `%${filters.seller_name}%`;
    }

    if (filters.product_name) {
      conditions.push('p.name LIKE :product_name');
      params.product_name = `%${filters.product_name}%`;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const orderDirection = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    params.limit = Math.max(1, filters.limit ?? 20);
    params.offset = Math.max(0, filters.offset ?? 0);

    const query = `
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
        INNER JOIN products AS p ON p.id = m.id_product
      ${whereClause}
      ORDER BY m.created_at ${orderDirection}
      LIMIT :limit OFFSET :offset
    `;

    return this.db.prepare(query).all(params);
  }
}