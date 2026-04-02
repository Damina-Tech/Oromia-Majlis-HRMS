import { PrismaClient } from "@prisma/client";
import { seedPermissionsAndRoleMappings } from "./permission-seed.shared";

const prisma = new PrismaClient();

async function seedPermissions() {
  await seedPermissionsAndRoleMappings(prisma);
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

