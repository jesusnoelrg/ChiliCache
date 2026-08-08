export type Unit = 'g' | 'kg' | 'ml' | 'L';

export interface Product {
  id: number;
  name: string;
  unit: Unit;
  net_content: number;
  price: number;
  stock: number;
  is_active: 0 | 1;
  created_at: string;
}

export interface CreateProductDTO {
  name: string;
  unit?: Unit;
  net_content: number;
  price: number;
  stock: number;
};

export interface UpdateProductDTO {
  name?: string;
  unit?: string;
  net_content?: number;
  price?: number;
};

export interface ProductFilterDTO {
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
  orderBy?: 'asc' | 'desc';
}

export interface SelectStockById {
  id: number;
  stock: number;
}

export interface ListProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
}