import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const DIVISION_DEFS = [
  { code: "HR" as const, name: "Human Resources", description: "Employees, sectors, leave, attendance, payroll" },
  { code: "HALAL" as const, name: "Halal Certification", description: "Halal business and product certification" },
  { code: "MEMBERSHIP" as const, name: "Membership", description: "Majlis membership registration and renewals" },
  { code: "INSTITUTION" as const, name: "Institutions", description: "Institution recognition and assignments" },
  { code: "FINANCE" as const, name: "Finance", description: "Expenses, payroll payments, financial approvals" },
  { code: "DOCUMENTS" as const, name: "Documents", description: "Templates, certificates, and document generation" },
];

const LEGACY_DIVISION_EMAILS: Record<string, string> = {
  "hr.admin@oromia.gov.et": "hr.admin@oriasc.org",
  "halal.admin@oromia.gov.et": "halal.admin@oriasc.org",
  "membership.admin@oromia.gov.et": "membership.admin@oriasc.org",
  "institution.admin@oromia.gov.et": "institution.admin@oriasc.org",
  "multi.admin@oromia.gov.et": "multi.admin@oriasc.org",
};

const DIVISION_ADMIN_USERS = [
  {
    email: "hr.admin@oriasc.org",
    firstName: "Sara",
    lastName: "Hussen",
    roleName: "HR_DIVISION_ADMIN",
    divisionCode: "HR" as const,
    isHead: true,
  },
  {
    email: "halal.admin@oriasc.org",
    firstName: "Omar",
    lastName: "Yusuf",
    roleName: "HALAL_DIVISION_ADMIN",
    divisionCode: "HALAL" as const,
    isHead: true,
  },
  {
    email: "membership.admin@oriasc.org",
    firstName: "Fatuma",
    lastName: "Ahmed",
    roleName: "MEMBERSHIP_DIVISION_ADMIN",
    divisionCode: "MEMBERSHIP" as const,
    isHead: true,
  },
  {
    email: "institution.admin@oriasc.org",
    firstName: "Daniel",
    lastName: "Bekele",
    roleName: "INSTITUTION_DIVISION_ADMIN",
    divisionCode: "INSTITUTION" as const,
    isHead: true,
  },
  {
    email: "multi.admin@oriasc.org",
    firstName: "Hanna",
    lastName: "Mulugeta",
    roleName: "HR_DIVISION_ADMIN",
    divisionCode: "HR" as const,
    isHead: false,
    extraAssignments: [{ roleName: "HALAL_DIVISION_ADMIN", divisionCode: "HALAL" as const }],
  },
];

const DEFAULT_PASSWORD = process.env.DIVISION_ADMIN_PASSWORD || "Division@12345";

export async function seedOrgDivisionsAndAdmins(prisma: PrismaClient) {
  console.log("🏛️  Seeding org divisions...");

  for (const def of DIVISION_DEFS) {
    await prisma.orgDivision.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description, active: true },
      create: def,
    });
  }
  console.log(`✅ Upserted ${DIVISION_DEFS.length} org divisions`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const spec of DIVISION_ADMIN_USERS) {
    const legacyEmail = Object.entries(LEGACY_DIVISION_EMAILS).find(([, next]) => next === spec.email)?.[0];
    if (legacyEmail) {
      const existingNew = await prisma.user.findUnique({ where: { email: spec.email } });
      const existingLegacy = await prisma.user.findUnique({ where: { email: legacyEmail } });
      if (!existingNew && existingLegacy) {
        await prisma.user.update({ where: { id: existingLegacy.id }, data: { email: spec.email } });
      }
    }

    const division = await prisma.orgDivision.findUnique({ where: { code: spec.divisionCode } });
    const role = await prisma.role.findUnique({ where: { name: spec.roleName } });
    if (!division || !role) {
      console.warn(`⚠️  Skip ${spec.email}: missing division or role ${spec.divisionCode}/${spec.roleName}`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        status: "ACTIVE",
      },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        status: "ACTIVE",
        passwordHash,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    await prisma.userDivisionAssignment.upsert({
      where: {
        userId_divisionId_roleId: { userId: user.id, divisionId: division.id, roleId: role.id },
      },
      update: { isPrimary: true },
      create: {
        userId: user.id,
        divisionId: division.id,
        roleId: role.id,
        isPrimary: true,
      },
    });

    if (spec.isHead) {
      await prisma.orgDivision.update({
        where: { id: division.id },
        data: { headUserId: user.id },
      });
    }

    if (spec.extraAssignments?.length) {
      for (const extra of spec.extraAssignments) {
        const extraDiv = await prisma.orgDivision.findUnique({ where: { code: extra.divisionCode } });
        const extraRole = await prisma.role.findUnique({ where: { name: extra.roleName } });
        if (!extraDiv || !extraRole) continue;
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: extraRole.id } },
          update: {},
          create: { userId: user.id, roleId: extraRole.id },
        });
        await prisma.userDivisionAssignment.upsert({
          where: {
            userId_divisionId_roleId: { userId: user.id, divisionId: extraDiv.id, roleId: extraRole.id },
          },
          update: {},
          create: {
            userId: user.id,
            divisionId: extraDiv.id,
            roleId: extraRole.id,
            isPrimary: false,
          },
        });
      }
    }

    console.log(`✅ Division admin: ${spec.email} (${spec.divisionCode})`);
  }

  console.log(`   Default password for division admins: ${DEFAULT_PASSWORD}`);
}
