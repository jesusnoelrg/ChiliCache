export interface CreateSaleDTO {
  id_client: number;
  id_user: number;
  invoice: number;
  products: SaleDetailItemDTO[]
}

export interface SaleDetailItemDTO {
  id_product: number;
  price: number;
  amount: number;
}

/*
1.- Verificar el producto
2.- Verificar que haya suficiente stock
3.- Calcular el total
4.- Ejecutar sentencias
5.- Restar el stock

*/