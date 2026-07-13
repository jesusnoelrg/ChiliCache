import Router from "express";
import { ClientController } from "../controllers/client.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.post('/', isAuthenticated, ClientController.createClient);

router.get('/:id', isAuthenticated, ClientController.getClientById);

router.get('/', isAuthenticated, ClientController.getClients);

router.put('/:id', isAuthenticated, ClientController.updateClient);

router.delete('/:id', isAuthenticated, ClientController.deleteClient);

export default router;