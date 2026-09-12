import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { addToCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller";

const router = Router();

router.use(requireAuth);
router.get("/", getCart);
router.post("/", addToCart);
router.patch("/:id", updateCartItem);
router.delete("/:id", removeCartItem);

export default router;
