import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Role, User } from "@prisma/client";
import { env } from "../config/env.js";

export type AccessPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(user: Pick<User, "id" | "email" | "role">) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m"
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function refreshExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
