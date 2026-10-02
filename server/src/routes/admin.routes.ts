import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import {
  adminListProducts,
  adminOrders,
  adminUpdateProductStatus,
  approveVendor,
  getCommission,
  listUsers,
  pendingVendors,
  platformStats,
  updateCommission,
  updateUserStatus,
  vendorPerformanceReport,
} from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/stats", platformStats);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/vendors/pending", pendingVendors);
router.patch("/vendors/:id/approve", approveVendor);
router.get("/products", adminListProducts);
router.patch("/products/:id/status", adminUpdateProductStatus);
router.get("/orders", adminOrders);
router.get("/commission", getCommission);
router.patch("/commission", updateCommission);
router.get("/reports/vendor-performance", vendorPerformanceReport);

export default router;
