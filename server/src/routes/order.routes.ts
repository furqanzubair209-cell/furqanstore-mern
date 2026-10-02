import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { createOrder, myOrderDetail, myOrders, updateOrderStatus } from "../controllers/order.controller";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", myOrders);
router.get("/:id", myOrderDetail);
router.patch("/:id/status", requireRole("VENDOR", "ADMIN", "SUPER_ADMIN"), updateOrderStatus);

export default router;
