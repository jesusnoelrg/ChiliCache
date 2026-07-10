export interface ClientID {
  id: string;
}

export interface CreateClientDTO {
  name: string;
  rfc: string;
  address: string;
  phone?: string;
  email?: string;
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
  limit?: number;
  offset?: number;
}