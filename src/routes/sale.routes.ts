import Router from "express";
import { SaleController } from "../controllers/sale.controller";

const router = Router();

router.post('/', SaleController.createSale);

router.get('/', SaleController.getSales);

export default router;