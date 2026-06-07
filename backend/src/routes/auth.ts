import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createRefreshToken, refreshExpiry, signAccessToken } from "../utils/tokens.js";
import { fail, ok } from "../utils/responses.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function issueTokens(user: { id: string; email: string; name: string; role: "ADMIN" | "USER" }) {
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiry() }
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    user
  };
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email.toLowerCase(), passwordHash },
      select: { id: true, email: true, name: true, role: true }
    });
    return ok(res, await issueTokens(user), 201);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return fail(res, "Invalid email or password", 401);
    }

    return ok(
      res,
      await issueTokens({ id: user.id, email: user.email, name: user.name, role: user.role })
    );
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
    const saved = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true, role: true } } }
    });

    if (!saved || saved.expiresAt < new Date()) return fail(res, "Invalid refresh token", 401);
    return ok(res, { accessToken: signAccessToken(saved.user) });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
    await prisma.refreshToken.deleteMany({ where: { token } });
    return ok(res, { loggedOut: true });
  })
);
