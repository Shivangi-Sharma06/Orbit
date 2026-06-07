import type { Server } from "socket.io";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fail, ok } from "../utils/responses.js";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  battery: z.number().int().min(0).max(100).nullable().optional(),
  timestamp: z.string().datetime().optional()
});

async function ingest(io: Server, deviceId: string, data: z.infer<typeof locationSchema>) {
  const location = await prisma.location.create({
    data: {
      deviceId,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      speed: data.speed,
      battery: data.battery,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
    }
  });
  await prisma.device.update({ where: { deviceId }, data: { lastSeen: location.timestamp, status: "ACTIVE" } });
  io.to(`device:${deviceId}`).emit("location:update", location);
  return location;
}

export function gpsRouter(io: Server) {
  const router = Router();

  router.post(
    "/location",
    asyncHandler(async (req, res) => {
      const deviceId = String(req.headers["x-device-id"] ?? "");
      const secret = String(req.headers["x-device-secret"] ?? "");
      const device = await prisma.device.findUnique({ where: { deviceId } });
      if (!device || device.activationCode !== secret) return fail(res, "Invalid device credentials", 401);
      const location = await ingest(io, deviceId, locationSchema.parse(req.body));
      return ok(res, { success: true, location });
    })
  );

  router.post(
    "/simulate/:deviceId",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const deviceId = String(req.params.deviceId);
      const latest = await prisma.location.findFirst({
        where: { deviceId },
        orderBy: { timestamp: "desc" }
      });
      const base = latest ?? { latitude: 28.6139, longitude: 77.209, battery: 90 };
      const location = await ingest(io, deviceId, {
        latitude: base.latitude + (Math.random() - 0.5) * 0.002,
        longitude: base.longitude + (Math.random() - 0.5) * 0.002,
        speed: Math.round(Math.random() * 60),
        battery: Math.max(0, Number(base.battery ?? 90) - Math.round(Math.random() * 2))
      });
      return ok(res, location);
    })
  );

  return router;
}
