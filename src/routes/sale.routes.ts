import Router from "express";
import { SaleController } from "../controllers/sale.controller";
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', isAuthenticated, SaleController.createSale);

router.get('/', isAuthenticated, SaleController.getSales);

router.get('/:id', isAuthenticated, SaleController.getSaleById);

router.patch('/:id/cancel', isAuthenticated, SaleController.cancelSaleById)

export default router;