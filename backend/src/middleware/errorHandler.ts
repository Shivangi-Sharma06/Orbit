import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: err.issues[0]?.message ?? "Invalid request" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ success: false, error: "A record with this value already exists" });
    if (err.code === "P2025") return res.status(404).json({ success: false, error: "Record not found" });
  }

  const message = err instanceof Error ? err.message : "Unexpected server error";
  console.error(err);
  res.status(500).json({ success: false, error: message });
}
