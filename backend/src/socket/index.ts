import type { Server } from "socket.io";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function registerSocket(io: Server) {
  io.on("connection", (socket) => {
    socket.on("join:device", async ({ deviceId, token }: { deviceId?: string; token?: string }) => {
      if (!deviceId || !token) return socket.emit("error", { error: "Missing device or token" });

      try {
        const user = verifyAccessToken(token);
        const device = await prisma.device.findUnique({ where: { deviceId } });
        const allowed = user.role === "ADMIN" || device?.ownerId === user.sub;
        if (!allowed) return socket.emit("error", { error: "Not allowed to join device" });
        socket.join(`device:${deviceId}`);
      } catch {
        socket.emit("error", { error: "Invalid token" });
      }
    });

    socket.on("leave:device", ({ deviceId }: { deviceId?: string }) => {
      if (deviceId) socket.leave(`device:${deviceId}`);
    });
  });
}
