import { PrismaClient } from "@prisma/client";
import { seedMosqueInstitutionCertificateTemplate } from "../src/modules/institutions/mosque-institution-certificate-seed.js";
import { seedHalalCertificateTemplates } from "../src/modules/halal/halal-certificate-template-seed.js";
import { seedMembershipIdCertificateTemplate } from "../src/modules/membership/membership-id-certificate-seed.js";

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
  await seedHalalCertificateTemplates(prisma, admin.id);
  await seedMembershipIdCertificateTemplate(prisma, admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
