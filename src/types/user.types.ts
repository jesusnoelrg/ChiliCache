
export interface CreateUserDTO {
  username: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface GetId {
  id: string;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  full_name?: string;
  role?: string;
}

export interface User {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: string;
}   