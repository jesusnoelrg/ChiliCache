import { Router } from 'express';
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { handleErrorLogo } from '../middlewares/error_multer.middleware';

import { CompanyController } from '../controllers/company.controller';

const router = Router();

router.get('/', isAuthenticated, authorize(['admin']), CompanyController.getInfo);

router.put(
  '/', 
  isAuthenticated, 
  authorize(['admin']), 
  uploadImage.single('logo'), 
  handleErrorLogo,
  CompanyController.updateInfo
);

export default router;