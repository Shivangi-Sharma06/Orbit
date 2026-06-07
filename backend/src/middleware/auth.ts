import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/responses.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return fail(res, "Missing authorization token", 401);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return fail(res, "Admin access required", 403);
  next();
}
