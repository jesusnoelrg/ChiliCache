import { Router } from 'express';
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

import { CompanyController } from '../controllers/company.controller';

const router = Router();

router.get('/public', CompanyController.getPublic);

router.get('/', isAuthenticated, authorize(['admin']), CompanyController.getInfo);

router.put('/', isAuthenticated, authorize(['admin']), CompanyController.updateInfo);

export default router;