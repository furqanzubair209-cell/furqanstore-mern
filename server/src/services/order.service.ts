import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { calculateCommission, getActiveCommissionRate } from "./commission.service";
import { emitToUser, emitToAdmins } from "../sockets/io";
import { notifyAdmins, notifyUser } from "./notification.service";

type PlaceOrderInput = {
  userId: number;
  shippingAddress: string;
  paymentMethod: "COD" | "CARD";
};

// The full checkout is one atomic unit: validate -> lock stock -> compute
// commission -> write order/items -> decrement stock -> clear cart.
// Any failure anywhere rolls the entire thing back, so it is never possible
// to end up with an order missing items, stock deducted without an order,
// or a cleared cart when the order failed.
export async function placeOrder({ userId, shippingAddress, paymentMethod }: PlaceOrderInput) {
  if (!shippingAddress?.trim()) {
    throw new AppError("Shipping address is required", 422);
  }

  const result = await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new AppError("Your cart is empty", 400);
    }

    const rate = await getActiveCommissionRate(tx);

    let subtotal = 0;
    let commissionTotal = 0;
    const itemsToCreate: {
      productId: number;
      productName: string;
      vendorId: number;
      quantity: number;
      unitPrice: number;
      grossAmount: number;
      commissionRate: number;
      commissionAmount: number;
      vendorEarning: number;
    }[] = [];

    for (const item of cartItems) {
      // Row-lock the product for the duration of this transaction so two
      // concurrent checkouts can never both read the same stock and both
      // succeed — the second waits, re-reads, and sees the decremented value.
      const [locked] = await tx.$queryRaw<
        { id: number; stock: number; status: string; price: string; name: string }[]
      >`SELECT id, stock, status, price, name FROM Product WHERE id = ${item.productId} FOR UPDATE`;

      if (!locked) {
        throw new AppError(`Product "${item.product.name}" no longer exists`, 400);
      }
      if (locked.status !== "ACTIVE") {
        throw new AppError(`"${locked.name}" is not currently available for purchase`, 400);
      }
      if (locked.stock <= 0) {
        throw new AppError(`"${locked.name}" is out of stock`, 400);
      }
      if (item.quantity > locked.stock) {
        throw new AppError(
          `Only ${locked.stock} unit(s) of "${locked.name}" left in stock`,
          400
        );
      }

      const unitPrice = Number(locked.price);
      const { gross, commissionAmount, vendorEarning } = calculateCommission(
        unitPrice,
        item.quantity,
        rate
      );

      subtotal += gross;
      commissionTotal += commissionAmount;

      itemsToCreate.push({
        productId: item.productId,
        productName: locked.name,
        vendorId: item.product.vendorId,
        quantity: item.quantity,
        unitPrice,
        grossAmount: gross,
        commissionRate: rate,
        commissionAmount,
        vendorEarning,
      });

      const newStock = locked.stock - item.quantity;
      const newStatus = newStock <= 0 ? "OUT_OF_STOCK" : "ACTIVE";
      const newBadge = newStock <= 0 ? "NONE" : newStock <= 5 ? "LOW_STOCK" : undefined;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          status: newStatus,
          ...(newBadge ? { badge: newBadge } : {}),
        },
      });
    }

    const total = subtotal; // taxes/shipping can be layered in here later

    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        commissionTotal,
        total,
        paymentMethod,
        shippingAddress,
        status: paymentMethod === "COD" ? "PENDING" : "PROCESSING",
        items: { create: itemsToCreate },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });

  // Fire real-time updates only after the transaction has actually committed.
  const vendorIds = [...new Set(result.items.map((i) => i.vendorId))];
  for (const vendorId of vendorIds) {
    const vendorItems = result.items.filter((i) => i.vendorId === vendorId);
    const vendorTotal = vendorItems.reduce((s, i) => s + Number(i.vendorEarning), 0);
    emitToUser(vendorId, "vendor:new-order", { orderId: result.id, items: vendorItems });
    await notifyUser(
      vendorId,
      "NEW_ORDER",
      `New order #${result.id} — Rs. ${vendorTotal.toLocaleString()} earning pending`,
      { orderId: result.id }
    );
  }
  emitToAdmins("admin:new-order", { orderId: result.id, total: result.total });
  await notifyAdmins("NEW_ORDER", `New order #${result.id} placed — Rs. ${Number(result.total).toLocaleString()}`, {
    orderId: result.id,
  });

  return result;
}
