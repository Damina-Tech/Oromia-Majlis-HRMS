import type { PrismaClient } from "@prisma/client";
import { buildEffectivePermissionNames } from "../users/permission-utils.js";
import { buildDivisionContextsFromAssignments, isSuperAdminUser } from "../org-divisions/division-access.js";
import type { UserDivisionContext } from "../org-divisions/division-access.js";

const userAuthInclude = {
  userRoles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
  userPermissions: { include: { permission: true } },
  employee: true,
  divisionAssignments: {
    include: {
      division: { select: { id: true, code: true } },
      role: { select: { name: true } },
    },
  },
} as const;

export async function buildAuthSessionForUser(
  prisma: PrismaClient,
  userId: string
): Promise<{
  roles: string[];
  permissions: string[];
  employeeId?: string;
  isSuperAdmin: boolean;
  divisions: UserDivisionContext[];
  avatarUrl: string | null;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userAuthInclude,
  });
  if (!user || user.status !== "ACTIVE") return null;

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = buildEffectivePermissionNames(user.userRoles as any, user.userPermissions as any);
  const divisions = buildDivisionContextsFromAssignments(user.divisionAssignments as any);
  const sessionUser = { roles, permissions, divisions };
  const isSuperAdmin = isSuperAdminUser(sessionUser);
  const avatarUrl = user.avatarUrl ?? user.employee?.avatarUrl ?? null;

  return {
    roles,
    permissions,
    employeeId: user.employee?.id,
    isSuperAdmin,
    divisions,
    avatarUrl,
  };
}

export { userAuthInclude };
