import Router from 'express';
import { UserController } from '../controllers/UserController.ts';

const router = Router();

//Obtener todos los clientes
router.get('/', UserController.getUsers)

export default router;