import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok(res, addresses);
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { label, line1, city, isDefault } = req.body;
  if (!line1?.trim() || !city?.trim()) throw new AppError("Address line and city are required", 422);

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { userId, label: label || "Home", line1, city, isDefault: !!isDefault },
  });
  return ok(res, address, "Address added", 201);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Address not found", 404);

  const { label, line1, city, isDefault } = req.body;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(line1 !== undefined ? { line1 } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(isDefault !== undefined ? { isDefault: !!isDefault } : {}),
    },
  });
  return ok(res, address, "Address updated");
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Address not found", 404);
  await prisma.address.delete({ where: { id } });
  return ok(res, null, "Address removed");
});

export const listWishlist = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user!.userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, items);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const productId = Number(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  return ok(res, item, "Added to wishlist", 201);
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const productId = Number(req.params.productId);
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
  return ok(res, null, "Removed from wishlist");
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });
  return ok(res, { notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.notification.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError("Notification not found", 404);
  const notification = await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return ok(res, notification);
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  return ok(res, null, "All notifications marked as read");
});
