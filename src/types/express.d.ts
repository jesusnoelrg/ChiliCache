import { Role } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        full_name: string;
        role: Role;
      };
    }
  }
}