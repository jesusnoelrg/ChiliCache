import type { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import { CompanyRepository } from '../repositories/company.repository';
import db from '../config/db';
import { DEFAULT_LOGO_PATH, normalizePublicPath } from '../config/paths';

const repository = new CompanyRepository(db);

const defaultCompany = {
  name: 'ChiliCache',
  logo_path: DEFAULT_LOGO_PATH,
  primary_color: '#bf2121',
  secondary_color: '#893030',
};

export const loadPublicData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let data = null;
    const cached = await redisClient.get('company:info');

    if(cached) {
      const { name, logo_path, primary_color, secondary_color } = JSON.parse(cached);
      data = {
        name,
        logo_path: normalizePublicPath(logo_path),
        primary_color,
        secondary_color
      }
    } else {
      const result = await repository.getPublicInfo();
      
      if(result) {
        data = {
          name: result.name,
          logo_path: normalizePublicPath(result.logo_path),
          primary_color: result.primary_color,
          secondary_color: result.secondary_color
        }

        await redisClient.set('company:info', JSON.stringify(result));
      }
    }

    res.locals.company = data || defaultCompany;
  } catch (err: any) {
    console.error('Error cargando datos de empresa:', err);
    res.locals.company = defaultCompany;
  }

  next();
}
