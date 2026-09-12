import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";

export const vendorStats = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user!.userId;
  const [productCount, items, pending, completed] = await Promise.all([
    prisma.product.count({ where: { vendorId } }),
    prisma.orderItem.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.orderItem.aggregate({ where: { vendorId, earningStatus: "PENDING" }, _sum: { vendorEarning: true } }),
    prisma.orderItem.aggregate({ where: { vendorId, earningStatus: "COMPLETED" }, _sum: { vendorEarning: true } }),
  ]);
  const totals = await prisma.orderItem.aggregate({
    where: { vendorId },
    _sum: { grossAmount: true, commissionAmount: true, vendorEarning: true, quantity: true },
    _count: true,
  });

  return ok(res, {
    productCount,
    recentSales: items,
    pendingEarnings: pending._sum.vendorEarning || 0,
    completedEarnings: completed._sum.vendorEarning || 0,
    totalGross: totals._sum.grossAmount || 0,
    totalCommissionPaid: totals._sum.commissionAmount || 0,
    totalEarnings: totals._sum.vendorEarning || 0,
    unitsSold: totals._sum.quantity || 0,
    orderItemCount: totals._count,
  });
});

export const vendorProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { vendorId: req.user!.userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, products);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user!.userId;
  const { name, description, price, stock, imageUrl, categoryId } = req.body;

  const product = await prisma.product.create({
    data: {
      vendorId,
      name,
      description,
      price,
      stock: Number(stock) || 0,
      imageUrl,
      categoryId: categoryId ? Number(categoryId) : null,
      status: "PENDING", // goes live only after admin/auto-approval policy
    },
  });
  return ok(res, product, "Product submitted", 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.product.findFirst({ where: { id, vendorId } });
  if (!existing) throw new AppError("Product not found", 404);

  const { name, description, price, stock, imageUrl, categoryId, status } = req.body;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(stock !== undefined ? { stock: Number(stock) } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(categoryId !== undefined ? { categoryId: Number(categoryId) } : {}),
      // Vendors may pause/resume their own listing but cannot self-approve
      // out of PENDING — only an admin can flip PENDING -> ACTIVE.
      ...(status && ["ACTIVE", "INACTIVE"].includes(status) && existing.status !== "PENDING"
        ? { status }
        : {}),
    },
  });
  return ok(res, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.product.findFirst({ where: { id, vendorId } });
  if (!existing) throw new AppError("Product not found", 404);
  await prisma.product.delete({ where: { id } });
  return ok(res, null, "Product deleted");
});

export const vendorOrders = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.user!.userId;
  const items = await prisma.orderItem.findMany({
    where: { vendorId },
    include: { order: true, product: { select: { name: true, imageUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, items);
});
