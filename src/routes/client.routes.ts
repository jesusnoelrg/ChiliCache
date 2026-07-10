import Router from "express";
import { ClientController } from "../controllers/client.controller";

const router = Router();

router.post('/', ClientController.createClient);

router.put('/:id', ClientController.updateClient);

router.get('/:id', ClientController.getClientById);

export default router;