import {type Request, type Response, type NextFunction, response} from 'express';
import redisClient  from '../config/redis';


export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.cookies['sid'];

  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'No hay sesión activa.' });
  }

  try {
    const sessionData = await redisClient.get(`session:${sessionId}`);

    if (!sessionData) {
      res.clearCookie('sid');
      return res.status(401).json({ error: 'Sesión expirada o inválida' });
    }

    req.user = JSON.parse(sessionData);
    next();
  } catch(err: any){
    console.error(err);
    return res.status(500).json({ "error": "[ERROR 500]: Error en la base de datos." });
  }
}

export const isAuthenticatedView = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.cookies['sid'];

  if (!sessionId) {
    return res.redirect('/login');
  }

  try {
    const sessionData = await redisClient.get(`session:${sessionId}`);

    if (!sessionData) {
      res.clearCookie('sid');
      return res.redirect('/view/login');
    }

    req.user = JSON.parse(sessionData);
    next();
  } catch (err: any) {
    console.error('Error en auth de vistas:', err);
    // En vistas, es mejor mandar un HTML de error o redireccionar, no un JSON
    return res.status(500).send('Error interno del servidor'); 
  }
}

export const logout = async (req: Request, res: Response) => {
  const sessionId = req.cookies['sid'];

  if (!sessionId) {
    return res.json({"success": true, "message": "No hay sesión que cerrar."})
  }

  await redisClient.del(`session:${sessionId}`);
  res.clearCookie('sid');
  
  return res.json({"success": true, "message": "Sesión cerrada."});
}