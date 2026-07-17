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
  seller_name?: string;
  client_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  min_total?: number;
  max_total?: number;
  invoice: number;
  limit?: number;
  offset?: number;
}