import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";
import { setCommissionRate, getActiveCommissionRate } from "../services/commission.service";
import { emitToUser } from "../sockets/io";
import { notifyUser } from "../services/notification.service";

export const platformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [users, vendors, customers, products, orders, revenue, commission, pendingVendors] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "VENDOR" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.orderItem.aggregate({ _sum: { commissionAmount: true } }),
      prisma.user.count({ where: { role: "VENDOR", status: "PENDING" } }),
    ]);

  return ok(res, {
    totalUsers: users,
    totalVendors: vendors,
    totalCustomers: customers,
    totalProducts: products,
    totalOrders: orders,
    totalRevenue: revenue._sum.total || 0,
    totalPlatformCommission: commission._sum.commissionAmount || 0,
    pendingVendorApprovals: pendingVendors,
  });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fullName: true, email: true, phone: true, role: true,
      status: true, vendorName: true, createdAt: true,
    },
  });
  return ok(res, users);
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const user = await prisma.user.update({ where: { id }, data: { status } });
  emitToUser(id, "account:status-changed", { status });
  await notifyUser(id, "ACCOUNT_STATUS", `Your account status changed to ${status}`, { status });
  return ok(res, user, "User status updated");
});

export const pendingVendors = asyncHandler(async (_req: Request, res: Response) => {
  const vendors = await prisma.user.findMany({ where: { role: "VENDOR", status: "PENDING" } });
  return ok(res, vendors);
});

export const approveVendor = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vendor = await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
  emitToUser(id, "account:approved", {});
  await notifyUser(id, "VENDOR_APPROVED", "Your vendor account has been approved — you can now list products");
  return ok(res, vendor, "Vendor approved");
});

export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const products = await prisma.product.findMany({
    where: status ? { status: status as any } : undefined,
    include: { vendor: { select: { fullName: true, vendorName: true } }, category: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, products);
});

export const adminUpdateProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const product = await prisma.product.update({ where: { id }, data: { status } });
  await notifyUser(product.vendorId, "PRODUCT_STATUS", `"${product.name}" is now ${status.toLowerCase()}`, {
    productId: product.id,
    status,
  });
  return ok(res, product, "Product status updated");
});

export const getCommission = asyncHandler(async (_req: Request, res: Response) => {
  const rate = await getActiveCommissionRate();
  const history = await prisma.commissionSetting.findMany({
    orderBy: { effectiveFrom: "desc" },
    include: { changedBy: { select: { fullName: true } } },
    take: 20,
  });
  return ok(res, { currentRate: rate, history });
});

export const updateCommission = asyncHandler(async (req: Request, res: Response) => {
  const { rate } = req.body;
  if (rate < 0 || rate > 100) throw new AppError("Commission rate must be between 0 and 100", 422);
  const setting = await setCommissionRate(Number(rate), req.user!.userId);
  return ok(res, setting, "Commission rate updated. Applies to future orders only.");
});

export const adminOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true, user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(res, orders);
});

export const vendorPerformanceReport = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.orderItem.groupBy({
    by: ["vendorId"],
    _sum: { grossAmount: true, commissionAmount: true, vendorEarning: true, quantity: true },
    _count: true,
  });
  const vendors = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.vendorId) } },
    select: { id: true, fullName: true, vendorName: true },
  });
  const merged = rows.map((r) => ({
    vendor: vendors.find((v) => v.id === r.vendorId),
    unitsSold: r._sum.quantity || 0,
    gross: r._sum.grossAmount || 0,
    commission: r._sum.commissionAmount || 0,
    earnings: r._sum.vendorEarning || 0,
    orderItemCount: r._count,
  }));
  return ok(res, merged);
});
