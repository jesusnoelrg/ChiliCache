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
router.get('/home', isAuthenticatedView, pathView('../../views/home.html'));
router.get('/users', isAuthenticatedView, pathView('../../views/users.html'));
router.get('/products', isAuthenticatedView, pathView('../../views/products.html'));
router.get('/clients', isAuthenticatedView, pathView('../../views/clients.html'));
router.get('/sales', isAuthenticatedView, pathView('../../views/sales.html'));
router.get('/movements', isAuthenticatedView, pathView('../../views/movements.html'));
router.get('/my_account', isAuthenticatedView, pathView('../../views/my_account.html'));
router.get('/company', isAuthenticatedView, pathView('../../views/company_data.html'));

export default router;