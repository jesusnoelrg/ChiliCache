export interface CreateProductoDTO {
  name: string;
  unit?: string;
  net_content: number;
  price: number;
  stock?: number;
}