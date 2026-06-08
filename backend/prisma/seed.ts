import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { createDeviceRecord } from "../src/utils/deviceCodes.js";

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@geonyx.dev" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@geonyx.dev",
      name: "Geonyx Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("Admin@1234", 12)
    }
  });

  await prisma.user.upsert({
    where: { email: "user@geonyx.dev" },
    update: {},
    create: {
      email: "user@geonyx.dev",
      name: "Demo User",
      role: "USER",
      passwordHash: await bcrypt.hash("User@1234", 12)
    }
  });

  const unclaimedCount = await prisma.device.count({ where: { status: "UNCLAIMED" } });
  for (let i = unclaimedCount; i < 5; i += 1) await createDeviceRecord();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
