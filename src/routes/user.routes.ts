import Router from 'express';
import { UserController } from '../controllers/user.controller';
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

//Obtener todos los usuarios
router.get('/', isAuthenticated, authorize(['seller', 'admin']), UserController.getUsers);

//Obtener un usuario
router.get('/:id', isAuthenticated, authorize(['seller', 'admin']), UserController.getUserById);

//Obtener solo los nombres de todos los usuarios
router.get('/all/name', isAuthenticated, authorize(['seller', 'admin']), UserController.getUsersName);

//Crear un nuevo usuario
router.post('/', UserController.createUser);

//Actualizar un usuario
router.put('/:id', isAuthenticated, authorize(['admin', 'seller']), UserController.updateUser);

//Eliminar un usuario
router.delete('/:id', isAuthenticated, authorize(['admin']), UserController.deleteUser)

export default router;