import { prisma } from "../lib/prisma";
import { emitToUser, emitToAdmins } from "../sockets/io";

export async function notifyUser(userId: number, type: string, message: string, payload: Record<string, unknown> = {}) {
  const notification = await prisma.notification.create({
    data: { userId, type, message },
  });
  emitToUser(userId, "notification:new", { ...notification, ...payload });
  return notification;
}

export async function notifyAdmins(type: string, message: string, payload: Record<string, unknown> = {}) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  const rows = await prisma.$transaction(
    admins.map((a) =>
      prisma.notification.create({ data: { userId: a.id, type, message } })
    )
  );
  emitToAdmins("notification:new", { type, message, ...payload });
  return rows;
}
