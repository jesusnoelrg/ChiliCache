export interface CreateProductDTO {
  name: string;
  unit?: Unit;
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
  unit?: Unit;
  minStock?: number;
  maxStock?: number;
  minContent?: number;
  maxContent?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface Unit {
  unit: 'g' | 'kg' | 'ml' | 'L';
}