import Router from "express";
import { SaleController } from "../controllers/sale.controller";

const router = Router();

router.post('/', SaleController.createSale);

router.get('/', SaleController.getSales);

router.get('/:id', SaleController.getSaleById);

export default router;