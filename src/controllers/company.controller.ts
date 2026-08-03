import type { Request, Response, NextFunction } from 'express';
import 'multer';
import fs from 'fs/promises';
import path from 'path';
import redisClient from '../config/redis';
import { phoneFormat, emailFormat, hexColorFormat } from '../utils/sql.utils';
import { DATA_DIR, normalizePublicPath } from '../config/paths';

import { CompanyRepository } from '../repositories/company.repository';
import { CompanyInfo, UpdateCompanyInfo } from '../types/company.types';

import db from '../config/db'

const repository = new CompanyRepository(db);

export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const CompanyController = {
  getInfo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cached = await redisClient.get('company:info');

      if(cached) {
        const companyData = JSON.parse(cached) as CompanyInfo;

        return res.status(200).json({
          "success": true,
          ...companyData,
          logo_path: normalizePublicPath(companyData.logo_path),
        });
      }

      const result = repository.getAllInfo() as CompanyInfo;

      if(!result) return res.status(404).json({
        "success": false,
        "message": 'No se ha encontrado los datos de la empresa.'
      })

      await redisClient.set('company:info', JSON.stringify(result));

      const responseData = {
        ...result,
        logo_path: normalizePublicPath(result.logo_path),
      };

      return res.status(200).json({
        "success": true,
        ...responseData,
      });
    } catch(err: any){
      next(err);
    }
  },

  updateInfo: async (req: RequestWithFile, res: Response, next: NextFunction) => {
    try {
      const {
        name, tax_id,
        address, phone, email,
        primary_color, secondary_color
      } = req.body;

      const newLogoPath = req.file
        ? path.posix.join('uploads', 'company', req.file.filename)
        : null;

      if(name && (name.length <= 3 || name.length >= 80)) return res.status(400).json({'success': false, 'message': 'El nombre de la empresa debe contener entre 3 y 80 caracteres.'});

      if(phone && phone.trim() !== '') {
        const validePhone = phoneFormat(phone);
        if(validePhone === 'error') return res.status(400).json({'success': false, 'message': 'Número de telefono inválido.'});
      }

      if(email && email.trim() !== '' && !emailFormat(email)) return res.status(400).json({'success': false, 'message': 'E-Mail inválido.'});
      
      if(primary_color && primary_color.trim() !== '' && !hexColorFormat(primary_color)) {
        return res.status(400).json({
          "success": false,
          "message": "El color primario tiene el formato incorrecto, usa el formato HexColor (ej. #563d7c)"
        });
      }

      if(secondary_color && secondary_color.trim() !== '' && !hexColorFormat(secondary_color)) {
        return res.status(400).json({
          "success": false,
          "message": "El color secundario tiene el formato incorrecto, usa el formato HexColor (ej. #563d7c)"
        });
      }

      const currentCompany = repository.getAllInfo();

      const data: UpdateCompanyInfo = {
        name: name !== '' ? name : 'ChiliCache',
        logo_path: newLogoPath ?? currentCompany?.logo_path ?? null,
        tax_id: tax_id !== '' ? tax_id : null,
        address: address !== '' ? address : null,
        phone: phone !== '' ? phone : null,
        email: email !== '' ? email : null,
        primary_color: primary_color !== '' ? primary_color : '#bf2121',
        secondary_color: secondary_color !== '' ? secondary_color : '#893030'
      }

      const result = repository.set(data);

      if(!result) res.status(400).json({ "success": false, "message": "Algo ha salido mal al intentar actualizar los datos de la empresa"})

      if(newLogoPath && currentCompany?.logo_path && currentCompany.logo_path !== newLogoPath) {
        try {
            const previousLogo = path.isAbsolute(currentCompany.logo_path)
              ? currentCompany.logo_path
              : path.join(DATA_DIR, currentCompany.logo_path);
            await fs.unlink(previousLogo);
          } catch (fileErr) {
            console.warn(`[FS] No se pudo eliminar el archivo anterior: ${currentCompany.logo_path}`);
          }
      }

      await redisClient.del('company:info');

      return res.status(200).json({
        "success":  true,
        "message": "¡Datos de la empresa actualizados exitosamente!"
      })
    } catch(err: any){
      next(err);
    }
  }
}