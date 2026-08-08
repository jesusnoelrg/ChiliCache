export interface CreateClientDTO {
  name: string;
  rfc: string;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface UpdateClientDTO {
  name?: string;
  rfc?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface GetClientsDTO {
  name?: string;
  rfc?: string;
  address?: string;
  phone?: string;
  email?: string;
  orderBy?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetClient {
  id: number;
  name: string;
  rfc: string;
  address: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface GetName {
  id: number;
  name: string;
}