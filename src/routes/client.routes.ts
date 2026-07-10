import Router from "express";
import { ClientController } from "../controllers/client.controller";

const router = Router();

router.post('/', ClientController.createClient);

router.get('/:id', ClientController.getClientById);

router.get('/', ClientController.getClients);

router.put('/:id', ClientController.updateClient);

router.delete('/:id', ClientController.deleteClient);

export default router;