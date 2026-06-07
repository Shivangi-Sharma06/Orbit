import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fail, ok } from "../utils/responses.js";

export const devicesRouter = Router();
devicesRouter.use(requireAuth);

async function ownedOrAdmin(userId: string, role: string, deviceId: string) {
  const device = await prisma.device.findUnique({ where: { deviceId } });
  return device && (role === "ADMIN" || device.ownerId === userId) ? device : null;
}

devicesRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const devices = await prisma.device.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { claimedAt: "desc" },
      include: { locations: { orderBy: { timestamp: "desc" }, take: 1 } }
    });
    return ok(res, devices.map((device) => ({ ...device, latestLocation: device.locations[0] ?? null })));
  })
);

devicesRouter.get(
  "/:deviceId",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const allowed = await ownedOrAdmin(req.user!.id, req.user!.role, deviceId);
    if (!allowed) return fail(res, "Device not found", 404);
    const device = await prisma.device.findUnique({
      where: { deviceId },
      include: { locations: { orderBy: { timestamp: "desc" }, take: 100 }, owner: true }
    });
    return ok(res, device);
  })
);

devicesRouter.get(
  "/:deviceId/locations",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const allowed = await ownedOrAdmin(req.user!.id, req.user!.role, deviceId);
    if (!allowed) return fail(res, "Device not found", 404);
    const query = z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.coerce.number().min(1).max(500).default(100)
      })
      .parse(req.query);
    const locations = await prisma.location.findMany({
      where: {
        deviceId,
        timestamp: { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined }
      },
      orderBy: { timestamp: "desc" },
      take: query.limit
    });
    return ok(res, locations);
  })
);

devicesRouter.post(
  "/claim",
  asyncHandler(async (req, res) => {
    const { activationCode } = z.object({ activationCode: z.string().length(16) }).parse(req.body);
    const device = await prisma.device.findUnique({ where: { activationCode } });
    if (!device || device.status !== "UNCLAIMED") return fail(res, "Activation code is invalid or already claimed", 400);
    const claimed = await prisma.device.update({
      where: { activationCode },
      data: { ownerId: req.user!.id, status: "CLAIMED", claimedAt: new Date() }
    });
    return ok(res, claimed);
  })
);

devicesRouter.post(
  "/:deviceId/unbind",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const allowed = await ownedOrAdmin(req.user!.id, req.user!.role, deviceId);
    if (!allowed) return fail(res, "Device not found", 404);
    const device = await prisma.device.update({
      where: { deviceId },
      data: { status: "UNCLAIMED", ownerId: null, claimedAt: null }
    });
    return ok(res, device);
  })
);
