import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { placeOrder } from "../services/order.service";
import { emitToUser } from "../sockets/io";
import { notifyUser } from "../services/notification.service";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

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

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const user = req.user!;

  if (!ORDER_STATUSES.includes(status)) throw new AppError("Invalid order status", 400);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "CANCELLED") throw new AppError("A cancelled order cannot be changed", 400);

  if (user.role === "VENDOR") {
    const owns = order.items.some((i) => i.vendorId === user.userId);
    if (!owns) throw new AppError("You do not have access to this order", 403);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({ where: { id: orderId }, data: { status } });

    if (status === "DELIVERED") {
      await tx.orderItem.updateMany({ where: { orderId }, data: { earningStatus: "COMPLETED" } });
    } else if (status === "CANCELLED") {
      await tx.orderItem.updateMany({ where: { orderId }, data: { earningStatus: "CANCELLED" } });
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            ...(product.status === "OUT_OF_STOCK" ? { status: "ACTIVE" } : {}),
          },
        });
      }
    }
    return result;
  });

  emitToUser(order.userId, "order:status-changed", { orderId, status });
  await notifyUser(order.userId, "ORDER_STATUS", `Order #${orderId} is now ${status}`, { orderId, status });
  return ok(res, updated, "Order status updated");
});
