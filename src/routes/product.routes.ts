import Router from "express";
import { ProductController } from "../controllers/product.controller";
import { isAuthenticated  } from "../middlewares/auth.middleware";
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authorize(['seller', 'admin']), isAuthenticated, ProductController.createProduct);

router.get('/:id', authorize(['seller', 'admin']), isAuthenticated, ProductController.getProductById);

router.get('/', authorize(['seller', 'admin']), isAuthenticated, ProductController.getProducts);

router.put('/:id', authorize(['seller', 'admin']), isAuthenticated, ProductController.updateProduct);

router.delete('/:id', authorize(['seller', 'admin']), isAuthenticated, ProductController.deleteProduct);

export default router;