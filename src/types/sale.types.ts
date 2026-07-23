export interface CreateSaleDTO {
  id_client: number;
  invoice: number;
  customer_payment: number;
  products: SaleDetailItem[];
}

export interface SaleDetailItem {
  id: number;
  name: string;
  amount: number;
  price: number;
}

export interface ProductRow {
  id: number;
  name: string;
  price: number;
  stock: number;
  is_active: number;
}

export interface GetSalesDTO {
  seller_name?: string;
  client_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  min_total?: number;
  max_total?: number;
  invoice: number;
  status?: SaleStatus;
  limit?: number;
  offset?: number;
}

export interface SaleStatus {
  status: 'completed' | 'cancelled'
}

export interface DataCreateSale {
  id_client: number;
  id_user: number;
  invoice: number;
  customer_payment: number;
}