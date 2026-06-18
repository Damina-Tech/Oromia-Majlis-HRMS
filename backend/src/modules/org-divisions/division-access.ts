import { OrgDivisionCode } from "@prisma/client";

export interface UserDivisionContext {
  divisionId: string;
  code: string;
  roleName: string;
  isPrimary: boolean;
}

type AuthUserShape = {
  roles: string[];
  permissions: string[];
  isSuperAdmin?: boolean;
  divisions?: UserDivisionContext[];
};

/** Permission modules each functional division may govern (prefix match on permission names). */
export const DIVISION_PERMISSION_MODULES: Record<OrgDivisionCode, string[]> = {
  HR: [
    "employees",
    "departments",
    "attendance",
    "leave",
    "payroll",
    "timesheet",
    "onboarding",
    "organization",
  ],
  HALAL: ["halal"],
  MEMBERSHIP: ["majlis.membership", "majlis.member"],
  INSTITUTION: ["majlis.institutions", "majlis.assignments"],
  FINANCE: ["expense", "expenses", "payroll"],
  DOCUMENTS: ["documents"],
};

export function isSuperAdminUser(user: AuthUserShape): boolean {
  return (
    user.isSuperAdmin === true ||
    user.roles.includes("ADMIN") ||
    user.roles.includes("SUPER_ADMIN") ||
    user.permissions.includes("system.admin")
  );
}

export function permissionBelongsToDivision(permissionName: string, code: OrgDivisionCode): boolean {
  const modules = DIVISION_PERMISSION_MODULES[code] ?? [];
  return modules.some(
    (m) => permissionName === m || permissionName.startsWith(`${m}.`) || permissionName.startsWith(`${m}:`)
  );
}

export function userDivisionCodes(user: AuthUserShape): OrgDivisionCode[] {
  return (user.divisions ?? []).map((d) => d.code as OrgDivisionCode);
}

export function userHasDivision(user: AuthUserShape, code: OrgDivisionCode): boolean {
  if (isSuperAdminUser(user)) return true;
  return userDivisionCodes(user).includes(code);
}

/** Super admin or user assigned to a division that owns this permission's module. */
export function userCanUsePermissionInScope(user: AuthUserShape, permissionName: string): boolean {
  if (isSuperAdminUser(user)) return true;
  if (!user.permissions.includes(permissionName)) return false;

  const divisions = user.divisions ?? [];
  if (divisions.length === 0) {
    // Legacy global roles without division assignment
    return true;
  }

  return divisions.some((d) => permissionBelongsToDivision(permissionName, d.code as OrgDivisionCode));
}

export function buildDivisionContextsFromAssignments(
  assignments: Array<{
    isPrimary: boolean;
    division: { id: string; code: OrgDivisionCode };
    role: { name: string };
  }>
): UserDivisionContext[] {
  return assignments.map((a) => ({
    divisionId: a.division.id,
    code: a.division.code,
    roleName: a.role.name,
    isPrimary: a.isPrimary,
  }));
}
