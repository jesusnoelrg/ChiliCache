export interface CreateClientDTO {
  name: string;
  rfc: string;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface UpdateClientDTO {
  id: number;
  name: string | null;
  rfc: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface GetClientsDTO {
  name?: string;
  rfc?: string;
  address?: string;
  phone?: string;
  email?: string;
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