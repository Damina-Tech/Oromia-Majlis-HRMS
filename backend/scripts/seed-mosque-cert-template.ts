import { PrismaClient } from "@prisma/client";
import { seedMosqueInstitutionCertificateTemplate } from "../src/modules/institutions/mosque-institution-certificate-seed.js";

const prisma = new PrismaClient();

async function main() {
  const admin =
    (await prisma.user.findFirst({ where: { email: "admin@oriasc.org" } })) ??
    (await prisma.user.findFirst());
  if (!admin) {
    console.error("No users found in database");
    process.exit(1);
  }
  await seedMosqueInstitutionCertificateTemplate(prisma, admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
