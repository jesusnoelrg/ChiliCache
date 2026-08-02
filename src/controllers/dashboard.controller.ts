import type { Request, Response, NextFunction } from 'express';
import db from '../config/db';

import { DashboardRepository } from '../repositories/dashboard.repository';

const dashboardRepository = new DashboardRepository(db);

export const DashboardController = {
  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result  = dashboardRepository.getAllCounts();

      return res.status(200).json({success: true, stats: result[0]});
    } catch (err: any) {
      next(err);
    }
  }
}