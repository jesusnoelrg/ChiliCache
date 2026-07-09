import Router from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

//Obtener todos los clientes
router.get('/', UserController.getUsers);

//Crear un nuevo usuario
router.post('/', UserController.createUser);

//Actualizar un usuario
router.put('/:id', UserController.updateUser);

//Eliminar un usuario
router.delete('/:id', UserController.deleteUser)

export default router;