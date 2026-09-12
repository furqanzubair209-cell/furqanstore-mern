import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, items);
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { productId, quantity = 1 } = req.body;

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product || product.status !== "ACTIVE") throw new AppError("Product is not available", 400);
  if (quantity > product.stock) throw new AppError(`Only ${product.stock} in stock`, 400);

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId: Number(productId) } },
    update: { quantity: { increment: Number(quantity) } },
    create: { userId, productId: Number(productId), quantity: Number(quantity) },
  });

  return ok(res, item, "Added to cart");
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { quantity } = req.body;
  const id = Number(req.params.id);

  const item = await prisma.cartItem.findFirst({ where: { id, userId }, include: { product: true } });
  if (!item) throw new AppError("Cart item not found", 404);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id } });
    return ok(res, null, "Item removed");
  }
  if (quantity > item.product.stock) throw new AppError(`Only ${item.product.stock} in stock`, 400);

  const updated = await prisma.cartItem.update({ where: { id }, data: { quantity } });
  return ok(res, updated, "Cart updated");
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);

  const item = await prisma.cartItem.findFirst({ where: { id, userId } });
  if (!item) throw new AppError("Cart item not found", 404);

  await prisma.cartItem.delete({ where: { id } });
  return ok(res, null, "Item removed");
});
