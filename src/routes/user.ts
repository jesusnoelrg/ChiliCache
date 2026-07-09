import Router from 'express';
import { UserController } from '../controllers/UserController.ts';

const router = Router();

//Obtener todos los clientes
router.get('/', UserController.getUsers);

//Crear un nuevo usuario
router.post('/', UserController.createUser);

//Actualizar un usuario
router.put('/:id', UserController.updateUser);

export default router;