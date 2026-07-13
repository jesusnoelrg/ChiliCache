import type {Request, Response, NextFunction} from 'express';
import cookieParser from 'cookie-parser';


export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
  } catch(err: any){
    console.error(err);
    return res.status(500).json({ success: false, message: "[ERROR 500]: Error en la base de datos." });
  }
}