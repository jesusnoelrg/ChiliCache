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
        name,
        logo: logo_path,
        primary_color,
        secondary_color
      }
    } else {
      const result = await repository.getPublicInfo();
      
      if(result) {
        data = {
          name: result.name,
          logo: result.logo_path,
          primary_color: result.primary_color,
          secondary_color: result.secondary_color
        }

        await redisClient.set('company:info', JSON.stringify(result));
      }
    }

    res.locals.company = data || {
      name: 'ChiliCache',
      logo: '',
      primary_color: '#bf2121',
      secondary_color: '#893030'
    }
  } catch (err: any) {
    console.error('Error cargando datos de empresa:', err);

    res.locals.company = {
      name: 'ChiliCache',
      logo: '',
      primary_color: '#bf2121',
      secondary_color: '#893030'
    }
  }

  next();
}