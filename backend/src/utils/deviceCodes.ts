import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChars(length: number) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function makeDeviceId() {
  return `DEV-${randomChars(4)}-${randomChars(4)}`;
}

export function makeActivationCode() {
  return randomChars(16);
}

export function makeClaimUrl(deviceId: string, activationCode: string) {
  const token = Buffer.from(JSON.stringify({ deviceId, activationCode })).toString("base64url");
  return `${env.FRONTEND_URL}/claim?token=${token}`;
}

export async function createDeviceRecord() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const deviceId = makeDeviceId();
    const activationCode = makeActivationCode();
    const claimUrl = makeClaimUrl(deviceId, activationCode);
    const qrCodeBase64 = await QRCode.toDataURL(claimUrl);

    try {
      return await prisma.device.create({
        data: { deviceId, activationCode, qrCodeBase64 }
      });
    } catch {
      if (attempt === 7) throw new Error("Could not generate unique device credentials");
    }
  }

  throw new Error("Could not create device");
}
