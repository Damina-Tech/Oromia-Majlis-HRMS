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
  const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
  return (
    user.isSuperAdmin === true ||
    roles.includes("ADMIN") ||
    roles.includes("SUPER_ADMIN") ||
    (user.permissions ?? []).includes("system.admin")
  );
}

const INTERNAL_STAFF_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "HR",
  "MANAGER",
  "EMPLOYEE",
  "MAJLIS_REPRESENTATIVE",
  "DIVISION_OFFICER",
  "HR_DIVISION_ADMIN",
  "HALAL_DIVISION_ADMIN",
  "MEMBERSHIP_DIVISION_ADMIN",
  "INSTITUTION_DIVISION_ADMIN",
]);

/** Permissions that indicate an internal/staff account (not a public portal-only registrant). */
const INTERNAL_STAFF_PERMISSIONS = [
  "system.admin",
  "users.read",
  "users.write",
  "employees.read",
  "employees.write",
  "divisions.manage",
  "divisions.read",
  "majlis.membership.view",
  "majlis.membership.admin",
  "majlis.membership.register",
  "majlis.institutions.read",
  "majlis.institutions.write",
  "halal.admin",
  "halal.supervisor",
  "halal.inspector",
  "halal.committee",
  "halal.finance",
  "payroll.view",
  "attendance.manage",
];

/**
 * True for internal staff/admin accounts. Used so users who also have MEMBER / majlis.member
 * (e.g. ADMIN has all permissions) still land on the main dashboard instead of the member portal.
 */
export function isInternalStaffUser(user: AuthUserShape | null | undefined): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
  if (roles.some((r) => INTERNAL_STAFF_ROLES.has(r) || r.endsWith("_DIVISION_ADMIN"))) {
    return true;
  }
  const perms = user.permissions ?? [];
  return INTERNAL_STAFF_PERMISSIONS.some((p) => perms.includes(p));
}

/** Portal-only Halal business registrant (no staff role). */
export function isHalalBusinessPortalOnly(user: AuthUserShape | null | undefined): boolean {
  if (!user || isInternalStaffUser(user)) return false;
  const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
  return roles.includes("HALAL_BUSINESS") && (user.permissions ?? []).includes("halal.business");
}

/** Portal-only Halal competency registrant (no staff role). */
export function isHalalCompetencyPortalOnly(user: AuthUserShape | null | undefined): boolean {
  if (!user || isInternalStaffUser(user)) return false;
  const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
  return roles.includes("HALAL_COMPETENCY") && (user.permissions ?? []).includes("halal.competency");
}

/** Portal-only membership member (no staff role). */
export function isMemberPortalOnly(user: AuthUserShape | null | undefined): boolean {
  if (!user || isInternalStaffUser(user)) return false;
  const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
  const perms = user.permissions ?? [];
  return (roles.includes("MEMBER") || perms.includes("majlis.member")) && perms.includes("majlis.member");
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
