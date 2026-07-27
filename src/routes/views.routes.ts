import { Router, Request, Response } from 'express';
import { isAuthenticatedView } from '../middlewares/auth.middleware'

const router = Router();

const pathView = (view: string) => (req: Request, res: Response) => res.render(view)

router.get('/login', pathView('login'));
router.get('/home', isAuthenticatedView, pathView('home'));
router.get('/users', isAuthenticatedView, pathView('users'));
router.get('/products', isAuthenticatedView, pathView('products'));
router.get('/clients', isAuthenticatedView, pathView('clients'));
router.get('/sales', isAuthenticatedView, pathView('sales'));
router.get('/movements', isAuthenticatedView, pathView('movements'));
router.get('/my_account', isAuthenticatedView, pathView('my_account'));
router.get('/company', isAuthenticatedView, pathView('company_data'));

export default router;