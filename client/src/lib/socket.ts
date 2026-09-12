import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (!socket || socket.disconnected) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    socket = io(base.replace(/\/api\/?$/, ""), {
      auth: { token },
      withCredentials: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
