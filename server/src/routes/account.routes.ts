import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  addToWishlist,
  createAddress,
  deleteAddress,
  listAddresses,
  listNotifications,
  listWishlist,
  markAllNotificationsRead,
  markNotificationRead,
  removeFromWishlist,
  updateAddress,
} from "../controllers/account.controller";

const router = Router();

router.use(requireAuth);

router.get("/addresses", listAddresses);
router.post("/addresses", createAddress);
router.patch("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

router.get("/wishlist", listWishlist);
router.post("/wishlist/:productId", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

export default router;
