import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware'
import path from 'path';

const router = Router();

const pathView = (view: string) => {
  return (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, view));
  }
}

router.get('/login', pathView('../../views/login.html'));
router.get('/home', isAuthenticated, pathView('../../views/inicio.html'));
router.get('/users', isAuthenticated, pathView('../../views/usuarios.html'));
router.get('/products', isAuthenticated, pathView('../../views/productos.html'));
router.get('/clients', isAuthenticated, pathView('../../views/clientes.html'));
router.get('/sales', isAuthenticated, pathView('../../views/ventas.html'));

export default router;