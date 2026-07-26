import { response, type Request, type Response } from 'express';
import fs from 'fs/promises';
import redisClient from '../config/redis.ts';
import { phoneFormat, emailFormat } from '../utils/sql.utils';

import { CompanyRepository } from '../repositories/company.repository';
import { CompanyInfo, UpdateCompanyInfo } from '../types/company.types';

import db from '../config/db'

const repository = new CompanyRepository(db);

export const CompanyController = {
  getPublic: async (req: Request, res: Response) => {
    try {
      const cached = await redisClient.get('company:info');

      if(cached) {
        const { name, logo_path } = JSON.parse(cached);

        if(name && logo_path) {
          return res.status(200).json({
            "success": true,
            name,
            logo: logo_path
          });
        }
      }

      const result = repository.getAllInfo() as CompanyInfo;

      if(!result) return res.status(404).json({
        "success": false,
        "message": 'No se ha encontrado los datos de la empresa.'
      })

      await redisClient.set('company:info', JSON.stringify(result));

      return res.status(200).json({
        "success": true,
        "name": result.name,
        "logo": result.logo_path
      });
    } catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  getInfo: async (req: Request, res: Response) => {
    try {
      const cached = await redisClient.get('company:info');

      if(cached) {
        const { 
          name, logo_path,
          tax_id, address,
          phone, email, updated_at
        } = JSON.parse(cached);

        return res.status(200).json({
          "success": true,
          name,
          logo: logo_path,
          tax_id,
          address,
          phone,
          email,
          updated_at
        });
      }

      const result = repository.getAllInfo() as CompanyInfo;

      if(!result) return res.status(404).json({
        "success": false,
        "message": 'No se ha encontrado los datos de la empresa.'
      })

      await redisClient.set('company:info', JSON.stringify(result));

      return res.status(200).json({
        "success": true,
        ...result,
      });
    } catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  },

  updateInfo: async (req: Request, res: Response) => {
    try {
      const {
        name, tax_id,
        address, phone, email
      } = req.body;

      const newLogoPath = req.file?.path;

      if(name && (name.length <= 3 || name.length >= 80)) return res.status(400).json({'success': false, 'message': 'El nombre de la empresa debe contener entre 3 y 80 caracteres.'});

      if(phone && phone.trim() !== '') {
        const validePhone = phoneFormat(phone);
        if(validePhone === 'error') return res.status(400).json({'success': false, 'message': 'Número de telefono inválido.'});
      }

      if(email && email.trim() !== '' && emailFormat(email)) return res.status(400).json({'success': false, 'message': 'E-Mail inválido.'});
      

      const currentCompany = repository.getAllInfo();

      const data: UpdateCompanyInfo = {
        name: name !== '' ? name : 'ChiliCache',
        logo_path: newLogoPath ?? currentCompany?.logo_path ?? null,
        tax_id: tax_id !== '' ? tax_id : null,
        address: address !== '' ? address : null,
        phone: phone !== '' ? phone : null,
        email: email !== '' ? email : null
      }

      const result = repository.set(data);

      if(!result) res.status(400).json({ "success": false, "message": "Algo ha salido mal al intentar actualizar los datos de la empresa"})

      if(newLogoPath && currentCompany?.logo_path && currentCompany.logo_path !== newLogoPath) {
        try {
            await fs.unlink(currentCompany.logo_path);
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
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
}