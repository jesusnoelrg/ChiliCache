import Router from "express";
import { ProductController } from "../controllers/ProductController";

const router = Router();

router.post('/', ProductController.createProduct);

export default router;