import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

type TxClient = Prisma.TransactionClient | PrismaClient;

const DEFAULT_RATE = Number(process.env.DEFAULT_COMMISSION_RATE || 10);

export async function getActiveCommissionRate(client: TxClient = prisma): Promise<number> {
  const active = await client.commissionSetting.findFirst({
    where: { active: true },
    orderBy: { effectiveFrom: "desc" },
  });
  return active ? Number(active.rate) : DEFAULT_RATE;
}

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
