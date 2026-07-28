import type { Request, Response, NextFunction } from 'express';

export const handleErrorGlobal = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR]: ${err.stack || err.message}`);

  const isDev = process.env.MODE === 'dev';
  
  if(req.originalUrl.startsWith('/api')) {
    return res.status(500).json({
      success: false,
      message: isDev ? err.message : 'Error interno en el servidor.',
      ...(isDev && { stack: err.stack })
    });
  }

  return res.status(500).render('errors/500');
}