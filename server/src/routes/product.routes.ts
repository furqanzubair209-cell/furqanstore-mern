import { Router } from "express";
import { getProduct, listCategories, listProducts } from "../controllers/product.controller";

const router = Router();

router.get("/", listProducts);
router.get("/categories", listCategories);
router.get("/:id", getProduct);

export default router;
