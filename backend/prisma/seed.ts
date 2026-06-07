import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { createDeviceRecord } from "../src/utils/deviceCodes.js";

async function main() {
  await prisma.refreshToken.deleteMany();
  await prisma.location.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: "admin@geonyx.dev",
        name: "Geonyx Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash("Admin@1234", 12)
      },
      {
        email: "user@geonyx.dev",
        name: "Demo User",
        role: "USER",
        passwordHash: await bcrypt.hash("User@1234", 12)
      }
    ]
  });

  for (let i = 0; i < 5; i += 1) await createDeviceRecord();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
