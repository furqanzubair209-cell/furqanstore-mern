import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/response";

// Public listing: paginated, filterable, searchable. Only ACTIVE products
// are ever returned here — inactive/pending/out-of-stock items are only
// visible to their vendor or an admin, via the vendor/admin endpoints.
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const { category, vendor, search, sort, minPrice, maxPrice } = req.query as Record<string, string>;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(category ? { category: { slug: category } } : {}),
    ...(vendor ? { vendorId: Number(vendor) } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: new Prisma.Decimal(minPrice) } : {}),
            ...(maxPrice ? { lte: new Prisma.Decimal(maxPrice) } : {}),
          },
        }
      : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "rating"
      ? { rating: "desc" }
      : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, vendor: { select: { id: true, fullName: true, vendorName: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return ok(res, { items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: { category: true, vendor: { select: { id: true, fullName: true, vendorName: true } } },
  });
  if (!product) throw new AppError("Product not found", 404);
  return ok(res, product);
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return ok(res, categories);
});
