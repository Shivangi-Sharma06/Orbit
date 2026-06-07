import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createDeviceRecord } from "../utils/deviceCodes.js";
import { fail, ok } from "../utils/responses.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.post(
  "/devices/create-bulk",
  asyncHandler(async (req, res) => {
    const { count } = z.object({ count: z.number().int().min(1).max(100) }).parse(req.body);
    const devices = [];
    for (let i = 0; i < count; i += 1) devices.push(await createDeviceRecord());
    return ok(res, devices, 201);
  })
);

adminRouter.get(
  "/devices",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        status: z.enum(["UNCLAIMED", "CLAIMED", "ACTIVE", "UNBOUND", "INACTIVE"]).optional(),
        search: z.string().optional()
      })
      .parse(req.query);
    const where = {
      status: query.status,
      OR: query.search
        ? [
            { deviceId: { contains: query.search, mode: "insensitive" as const } },
            { owner: { email: { contains: query.search, mode: "insensitive" as const } } }
          ]
        : undefined
    };
    const [items, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip: (query.page - 1) * 20,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { name: true, email: true } } }
      }),
      prisma.device.count({ where })
    ]);
    return ok(res, { items, total, page: query.page, pageSize: 20 });
  })
);

adminRouter.get(
  "/devices/:deviceId/qr",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) return fail(res, "Device not found", 404);
    return ok(res, { qrCodeBase64: device.qrCodeBase64 });
  })
);

adminRouter.post(
  "/devices/:deviceId/force-unbind",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const device = await prisma.device.update({
      where: { deviceId },
      data: { status: "UNCLAIMED", ownerId: null, claimedAt: null }
    });
    return ok(res, device);
  })
);

adminRouter.delete(
  "/devices/:deviceId",
  asyncHandler(async (req, res) => {
    const deviceId = String(req.params.deviceId);
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) return fail(res, "Device not found", 404);
    if (device.status !== "UNCLAIMED") return fail(res, "Only unclaimed devices can be deleted", 400);
    await prisma.device.delete({ where: { deviceId } });
    return ok(res, { deleted: true });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { devices: true } } }
    });
    return ok(res, users);
  })
);

adminRouter.patch(
  "/users/:userId/role",
  asyncHandler(async (req, res) => {
    const { role } = z.object({ role: z.enum(["ADMIN", "USER"]) }).parse(req.body);
    const userId = String(req.params.userId);
    const user = await prisma.user.update({ where: { id: userId }, data: { role } });
    return ok(res, user);
  })
);
