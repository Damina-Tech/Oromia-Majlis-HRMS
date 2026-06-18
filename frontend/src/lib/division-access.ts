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

const DIVISION_PERMISSION_MODULES: Record<string, string[]> = {
  HR: ["employees", "departments", "attendance", "leave", "payroll", "timesheet", "onboarding", "organization"],
  HALAL: ["halal"],
  MEMBERSHIP: ["majlis.membership", "majlis.member"],
  INSTITUTION: ["majlis.institutions", "majlis.assignments"],
  FINANCE: ["expense", "expenses", "payroll"],
  DOCUMENTS: ["documents"],
};

export function isSuperAdminUser(user: AuthUserShape | null | undefined): boolean {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    user.roles.includes("ADMIN") ||
    user.roles.includes("SUPER_ADMIN") ||
    user.permissions.includes("system.admin")
  );
}

function permissionBelongsToDivision(permissionName: string, code: string): boolean {
  const modules = DIVISION_PERMISSION_MODULES[code] ?? [];
  return modules.some(
    (m) => permissionName === m || permissionName.startsWith(`${m}.`) || permissionName.startsWith(`${m}:`)
  );
}

export function userCanUsePermissionInScope(user: AuthUserShape, permissionName: string): boolean {
  if (isSuperAdminUser(user)) return true;
  if (!user.permissions.includes(permissionName)) return false;

  const divisions = user.divisions ?? [];
  if (divisions.length === 0) return true;

  return divisions.some((d) => permissionBelongsToDivision(permissionName, d.code));
}

export function userHasDivision(user: AuthUserShape | null | undefined, code: string): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  return (user.divisions ?? []).some((d) => d.code === code);
}
