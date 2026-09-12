import { Router } from "express";
import { requireAuth, requireVendor } from "../middleware/auth";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  vendorOrders,
  vendorProducts,
  vendorStats,
} from "../controllers/vendor.controller";

const router = Router();

router.use(requireAuth, requireVendor);
router.get("/stats", vendorStats);
router.get("/products", vendorProducts);
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/orders", vendorOrders);

export default router;
