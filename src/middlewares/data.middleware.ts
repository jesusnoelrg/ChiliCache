import type { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis.ts';
import { CompanyRepository } from '../repositories/company.repository';
import db from '../config/db.ts';

const repository = new CompanyRepository(db);

export const loadPublicData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let data = null;
    const cached = await redisClient.get('company:info');

    if(cached) {
      const { name, logo_path, primary_color, secondary_color } = JSON.parse(cached);
      data = {
        companyName: name,
        companyLogo: logo_path,
        primaryColor: primary_color,
        secondaryColor: secondary_color
      }
    } else {
      const result = await repository.getPublicInfo();
      
      if(result) {
        data = {
          companyName: result.name,
          companyLogo: result.logo_path,
          primaryColor: result.primary_color,
          secondaryColor: result.secondary_color
        }

        await redisClient.set('company:info', JSON.stringify(result));
      }
    }

    res.locals.company = data || {
      companyName: 'ChiliCache',
      companyLogo: '',
      primaryColor: '#bf2121',
      secondaryColor: '#893030'
    }
  } catch (err: any) {
    console.error('Error cargando datos de empresa:', err);

    res.locals.company = {
      companyName: 'ChiliCache',
      companyLogo: '',
      primaryColor: '#bf2121',
      secondaryColor: '#893030'
    }
  }

  next();
}