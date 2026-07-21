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

export interface SelectStockById {
  id: number;
  stock: number;
}

export interface CreateMovement {
  type: TypeMovement;
  old_stock: number;
  new_stock: number;
  id_product: number;
  id_user: number;
}

export interface TypeMovement {
  type: 'created' | 'restock' | 'sale';
}