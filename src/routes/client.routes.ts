import Router from "express";
import { ClientController } from "../controllers/client.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authorize(['seller', 'admin']), isAuthenticated, ClientController.createClient);

router.get('/:id', authorize(['seller', 'admin']), isAuthenticated, ClientController.getClientById);

router.get('/', authorize(['seller', 'admin']), isAuthenticated, ClientController.getClients);

router.put('/:id', authorize(['seller', 'admin']), isAuthenticated, ClientController.updateClient);

router.delete('/:id', authorize(['seller', 'admin']), isAuthenticated, ClientController.deleteClient);

export default router;