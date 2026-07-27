import type {Request, Response, NextFunction} from 'express';
import { Role } from '../types/user.types';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction ) => {
    const user = req.user;

    if(!user){
      return res.status(401).json({ "success": false, "message": 'No autorizado: Usuario no autenticado' });
    }

    if(!allowedRoles.includes(user.role)){
      return res.status(403).json({
        "success": false,
        "message": "¡No tienes los permisos necesarios para realizar esa acción!",
        "required": allowedRoles,
        "current": user.role
      });
    }

    next();
  }
}