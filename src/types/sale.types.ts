export interface CreateSaleDTO {
  id_client: number;
  invoice: number;
  customer_payment: number;
  products: SaleDetailItemDTO[];
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
  status?: string;
  limit?: number;
  offset?: number;
}

export interface FiltersSaleReport {
  start_timestamp: string;
  end_timestamp: string;
  seller_name?: string;
  client_name?: string;
  invoice?: number;
}

export interface DataSaleReport {
  start_date: string;
  end_date: string;
  seller_name?: string;
  client_name?: string;
  data: SaleReportItem[]; 
}

export interface SaleReportItem {
  id: number;
  client_name: string;
  seller_name: string;
  total: number;
  invoice: string;
  date: string;
}