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

export interface MovementType {
  type: 'created' | 'restock' | 'sale' | 'cancel';
}