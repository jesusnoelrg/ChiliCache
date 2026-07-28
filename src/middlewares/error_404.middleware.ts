import type { Request, Response } from 'express';

export const errorNotFound = (req: Request, res: Response) => {
  if(req.originalUrl.startsWith('/api')){
    return res.status(404).json({
      success: false,
      message: `Endpoint no encontrado '${req.originalUrl}'`
    });
  }

  res.status(404).render('errors/404');
}