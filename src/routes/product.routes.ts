import Router from "express";
import { ProductController } from "../controllers/product.controller";
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', isAuthenticated, authorize(['seller', 'admin']), ProductController.createProduct);

router.get('/id/:id', isAuthenticated, authorize(['seller', 'admin']), ProductController.getProductById);

router.get('/', isAuthenticated, authorize(['seller', 'admin']), ProductController.getProducts);

router.put('/:id', isAuthenticated, authorize(['seller', 'admin']), ProductController.updateProduct);

router.get('/list/', isAuthenticated, authorize(['seller', 'admin']), ProductController.listProducts);

router.delete('/:id', isAuthenticated, authorize(['seller', 'admin']), ProductController.deleteProduct);

router.patch('/:id/toggle', isAuthenticated, authorize(['admin']), ProductController.toggleProduct);

router.patch('/:id/restock', isAuthenticated, authorize(['seller', 'admin']), ProductController.restockProduct);

export default router;