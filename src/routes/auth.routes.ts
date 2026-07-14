import Router from 'express';
import { UserController } from '../controllers/user.controller';
import { logout  } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', UserController.loginUser);

router.post('/logout', logout)

export default router;