import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { placeOrder } from "../services/order.service";
import { emitToUser } from "../sockets/io";
import { notifyUser } from "../services/notification.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress, paymentMethod } = req.body;
  const order = await placeOrder({
    userId: req.user!.userId,
    shippingAddress,
    paymentMethod: paymentMethod === "CARD" ? "CARD" : "COD",
  });
  return ok(res, order, "Order placed successfully", 201);
});

export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, orders);
});

export const myOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(req.params.id), userId: req.user!.userId },
    include: { items: true },
  });
  if (!order) throw new AppError("Order not found", 404);
  return ok(res, order);
});

// Admins can move any order forward; a vendor may only update the status
// of an order that actually contains one of their own products.
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const user = req.user!;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new AppError("Order not found", 404);

  if (user.role === "VENDOR") {
    const owns = order.items.some((i) => i.vendorId === user.userId);
    if (!owns) throw new AppError("You do not have access to this order", 403);
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });

  if (status === "DELIVERED") {
    await prisma.orderItem.updateMany({ where: { orderId }, data: { earningStatus: "COMPLETED" } });
  } else if (status === "CANCELLED") {
    await prisma.orderItem.updateMany({ where: { orderId }, data: { earningStatus: "CANCELLED" } });
  }

  emitToUser(order.userId, "order:status-changed", { orderId, status });
  await notifyUser(order.userId, "ORDER_STATUS", `Order #${orderId} is now ${status}`, { orderId, status });
  return ok(res, updated, "Order status updated");
});
