import { Router } from 'express';
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', isAuthenticated, authorize(['seller', 'admin']),  DashboardController.getStats);

export default router;