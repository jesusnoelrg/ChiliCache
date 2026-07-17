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
  unit?: 'g' | 'kg' | 'ml' | 'L';
  minStock?: number;
  maxStock?: number;
  minContent?: number;
  maxContent?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}