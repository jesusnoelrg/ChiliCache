import Router from 'express';
import { UserController } from '../controllers/user.controller';
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { autorize } from '../middlewares/role.middleware';

const router = Router();

//Obtener todos los usuarios
router.get('/', isAuthenticated, autorize(['seller', 'admin']), UserController.getUsers);

//Obtener un usuario
router.get('/:id', isAuthenticated, autorize(['seller', 'admin']), UserController.getUserById);

//Crear un nuevo usuario
router.post('/', isAuthenticated, autorize(['admin']), UserController.createUser);

//Actualizar un usuario
router.put('/:id', isAuthenticated, autorize(['admin']), UserController.updateUser);

//Eliminar un usuario
router.delete('/:id', isAuthenticated, autorize(['admin']), UserController.deleteUser)

export default router;