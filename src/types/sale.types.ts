export interface CreateSaleDTO {
  id_client: number;
  id_user: number;
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

/*
1.- Verificar el producto
2.- Verificar que haya suficiente stock
3.- Calcular el total
4.- Ejecutar sentencias
5.- Restar el stock

*/