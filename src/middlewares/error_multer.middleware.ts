import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const handleErrorLogo = (err: any, req: Request, res: Response, next: NextFunction) => {
  if(err instanceof multer.MulterError) {
    if(err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'Solo se permite subir un solo archivo (jpeg, jpg, png, webp).',
        error: 'Demasiados archivos'
      });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo de 2MB.',
        error: 'Archivo demasiado grande'
      });
    }

    return res.status(400).json({
      success: false,
      message: `Error de subida: ${err.message}`,
      error: err.code
    });
  }

  if(err && err.message.startsWith('INVALID_FILE_TYPE')) {
    return res.status(400).json({
      success: false,
      message: err.message.split(':')[1] || 'Formato de archivo no soportado',
      error: 'INVALID_FILE_TYPE'
    });
  }

  next(err);
}