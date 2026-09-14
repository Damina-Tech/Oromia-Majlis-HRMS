import prisma from "../../db/client.js";

const OWNER_ROLE = "INSTITUTION_OWNER";
const OWNER_PERM = "majlis.institution.owner";

/** Ensure INSTITUTION_OWNER role + permission exist (lightweight, idempotent). */
export async function ensureInstitutionOwnerRoleId(): Promise<string> {
  const permission = await prisma.permission.upsert({
    where: { name: OWNER_PERM },
    update: {
      description: "Manage own registered institution and recognition requests",
      module: "majlis",
      action: "institution.owner",
    },
    create: {
      name: OWNER_PERM,
      module: "majlis",
      action: "institution.owner",
      description: "Manage own registered institution and recognition requests",
    },
  });

  const role = await prisma.role.upsert({
    where: { name: OWNER_ROLE },
    update: {},
    create: {
      name: OWNER_ROLE,
      description: "Public institution / mosque registrant",
    },
  });

  const basePermNames = ["dashboard.view", "profile.read", "profile.write", OWNER_PERM] as const;
  for (const name of basePermNames) {
    const perm =
      name === OWNER_PERM
        ? permission
        : await prisma.permission.findUnique({ where: { name } });
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
  }

  return role.id;
}
