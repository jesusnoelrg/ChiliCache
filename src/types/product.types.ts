export interface ProductID {
  id: string;
};

export interface CreateProductDTO {
  name: string;
  unit?: string;
  net_content: number;
  price: number;
  stock?: number;
};

export interface UpdateProductDTO {
  name?: string;
  unit?: string;
  net_content?: number;
  price?: number;
};

export interface GetProductsDTO {
  name?: string;
  unit?: string;
  limit?: number;
  offset?: number;
}