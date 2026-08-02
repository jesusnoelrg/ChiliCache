export interface MovementsFilters {
  type: MovementType | null;
  seller_name: string | null;
  product_name: string | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  offset: number;
  limit: number;
  order: 'ASC' | 'DESC';
}

export interface CreateMovement {
  type: MovementType;
  old_stock: number;
  new_stock: number;
  id_product: number;
  id_user: number;
}

export type MovementType = 'created' | 'restock' | 'sale' | 'cancel';