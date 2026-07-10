import Router from "express";
import { ClientController } from "../controllers/client.controller";

const router = Router();

router.post('/', ClientController.createClient);

export default router;