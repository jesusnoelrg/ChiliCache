import Router from "express";
import { MovementController } from "../controllers/movements.controller";
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.get('/', isAuthenticated, authorize(['seller', 'admin']), MovementController.getMovements);

export default router;