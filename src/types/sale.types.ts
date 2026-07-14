export interface CreateSaleDTO {
  id_client: number;
  invoice: number;
  products: SaleDetailItemDTO[]
}

export interface SaleDetailItemDTO {
  id_product: number;
  amount: number;
}

export interface ProductRow {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface GetSalesDTO {
  user_username?: string;
  user_full_name?: string;
  client_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  limit?: number;
  offset?: number;
}