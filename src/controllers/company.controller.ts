import type { Request, Response } from 'express';
import redisClient from '../config/redis.ts';
import { CompanyRepository } from '../repositories/company.repository';

import { CompanyInfo, CompanyPublic } from '../types/company.types';

import db from '../config/db'

const repository = new CompanyRepository(db);

export const ComapnyController = {
  getPublic: async (req: Request, res: Response) => {
    try {
      const cached = await redisClient.get('company:info');

      if(cached) {
        const { name, logo_path } = JSON.parse(cached);

        return res.status(200).json({
          "success": true,
          name,
          logo: logo_path
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
        "logo": result.logo_path
      });
    } catch(err: any){
      console.log("Error: " + err);
      return res.status(500).json({
        "success": false,
        "message": "[ERROR 500]: Error en la base de datos."
      })
    }
  }
}