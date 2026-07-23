export interface MovementsFilters {
  type?: string;
  seller_name?: string;
  product_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  offset?: number;
  limit?: number;
  order: 'asc' | 'desc';
}