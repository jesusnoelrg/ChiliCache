import { Router, Request, Response } from 'express';
import { isAuthenticatedView } from '../middlewares/auth.middleware'
import path from 'path';

const router = Router();

const pathView = (view: string) => {
  return (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, view));
  }
}

router.get('/login', pathView('../../views/login.html'));
router.get('/home', isAuthenticatedView, pathView('../../views/inicio.html'));
router.get('/users', isAuthenticatedView, pathView('../../views/usuarios.html'));
router.get('/products', isAuthenticatedView, pathView('../../views/productos.html'));
router.get('/clients', isAuthenticatedView, pathView('../../views/clientes.html'));
router.get('/sales', isAuthenticatedView, pathView('../../views/ventas.html'));
router.get('/my_account', isAuthenticatedView, pathView('../../views/mi_cuenta.html'));

export default router;