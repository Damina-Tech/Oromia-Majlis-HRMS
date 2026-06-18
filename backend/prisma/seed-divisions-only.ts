import { PrismaClient } from "@prisma/client";
import { seedPermissionsAndRoleMappings } from "./permission-seed.shared";
import { seedOrgDivisionsAndAdmins } from "./org-division-seed.shared";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    "HR_DIVISION_ADMIN",
    "HALAL_DIVISION_ADMIN",
    "MEMBERSHIP_DIVISION_ADMIN",
    "INSTITUTION_DIVISION_ADMIN",
    "DIVISION_OFFICER",
  ];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  await seedPermissionsAndRoleMappings(prisma);
  await seedOrgDivisionsAndAdmins(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
