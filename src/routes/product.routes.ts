import Router from "express";
import { ProductController } from "../controllers/ProductController";

const router = Router();

router.post('/', ProductController.createProduct);

router.get('/:id', ProductController.getProductById);

router.get('/', ProductController.getProducts);

router.put('/:id', ProductController.updateProduct);

router.delete('/:id', ProductController.deleteProduct);

export default router;