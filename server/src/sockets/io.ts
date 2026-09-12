import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

let io: Server | null = null;

// Rooms: `user:<id>` for personal notices, `admins` for admin/super_admin.
// A socket that fails to present a valid access token on connect is
// dropped immediately — real-time channels get the same auth as the REST API.
export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.role === "ADMIN" || socket.data.role === "SUPER_ADMIN") {
      socket.join("admins");
    }
  });

  return io;
}

export function emitToUser(userId: number, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown) {
  io?.to("admins").emit(event, payload);
}
