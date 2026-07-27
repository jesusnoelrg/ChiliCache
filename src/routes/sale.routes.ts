import Router from "express";
import { SaleController } from "../controllers/sale.controller";
import { isAuthenticated } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', isAuthenticated, authorize(['seller', 'admin']), SaleController.createSale);

router.get('/', isAuthenticated, authorize(['seller', 'admin']), SaleController.getSales);

router.get('/:id', isAuthenticated, authorize(['seller', 'admin']), SaleController.getSaleById);

router.patch('/:id/cancel', isAuthenticated, authorize(['seller', 'admin']), SaleController.cancelSaleById);

router.get('/reports/pdf', isAuthenticated, authorize(['seller', 'admin']), SaleController.generateReportPDF)

export default router;