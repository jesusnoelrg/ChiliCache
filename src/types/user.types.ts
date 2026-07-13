export type Role = 'seller' | 'admin';

export interface LoginUser {
  username: string;
  password: string;
}

export interface SessionUser {
  uuid: string;
  username: string;
  password?: string; 
  role: Role
}

export interface CreateUserDTO {
  username: string;
  password: string;
  full_name: string;
  role?: Role;
}

export interface GetUsersDTO {
  username?: string;
  full_name?: string;
  role?: Role;
  limit?: number;
  offset?: number;
}

export interface GetId {
  id: number;
}

export interface UserRole {
  role: Role;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  full_name?: string;
  role?: Role;
}

export interface User {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: Role;
}   