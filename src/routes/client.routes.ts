import Router from "express";
import { ClientController } from "../controllers/client.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', isAuthenticated, authorize(['seller', 'admin']), ClientController.createClient);

router.get('/:id', isAuthenticated, authorize(['seller', 'admin']), ClientController.getClientById);

router.get('/', isAuthenticated, authorize(['seller', 'admin']), ClientController.getClients);

router.put('/:id', isAuthenticated, authorize(['seller', 'admin']), ClientController.updateClient);

router.delete('/:id', isAuthenticated, authorize(['seller', 'admin']), ClientController.deleteClient);

export default router;