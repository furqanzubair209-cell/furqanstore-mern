import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type TxClient = Prisma.TransactionClient | PrismaClient;

const DEFAULT_RATE = Number(process.env.DEFAULT_COMMISSION_RATE || 10);

// The single source of truth for "what rate applies right now". Order
// creation always calls this inside its own transaction so the rate it
// reads can never change underneath it mid-checkout.
export async function getActiveCommissionRate(client: TxClient = prisma): Promise<number> {
  const active = await client.commissionSetting.findFirst({
    where: { active: true },
    orderBy: { effectiveFrom: "desc" },
  });
  return active ? Number(active.rate) : DEFAULT_RATE;
}

// Changing the rate only affects orders placed after this call. Every
// existing OrderItem already has its own commissionRate/commissionAmount
// frozen at creation time, so history never shifts underneath the admin.
export async function setCommissionRate(rate: number, changedById: number) {
  return prisma.$transaction(async (tx) => {
    await tx.commissionSetting.updateMany({ where: { active: true }, data: { active: false } });
    return tx.commissionSetting.create({
      data: { rate, active: true, changedById },
    });
  });
}

export function calculateCommission(unitPrice: number, quantity: number, rate: number) {
  const gross = Number((unitPrice * quantity).toFixed(2));
  const commissionAmount = Number((gross * (rate / 100)).toFixed(2));
  const vendorEarning = Number((gross - commissionAmount).toFixed(2));
  return { gross, commissionAmount, vendorEarning };
}
