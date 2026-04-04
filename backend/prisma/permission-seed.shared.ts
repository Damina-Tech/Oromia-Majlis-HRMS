import type { PrismaClient } from "@prisma/client";

export const PERMISSIONS = [
  { name: "dashboard.view", module: "dashboard", action: "view", description: "View dashboard" },
  { name: "employees.read", module: "employees", action: "read", description: "View employees" },
  { name: "employees.write", module: "employees", action: "write", description: "Create/Edit employees" },
  { name: "employees.delete", module: "employees", action: "delete", description: "Delete employees" },
  { name: "employees.id.manage", module: "employees", action: "id.manage", description: "Manage employee ID templates and branding" },
  { name: "employees.id.generate", module: "employees", action: "id.generate", description: "Generate single employee ID cards" },
  { name: "employees.id.batch", module: "employees", action: "id.batch", description: "Batch generate employee ID cards" },
  { name: "departments.read", module: "departments", action: "read", description: "View departments" },
  { name: "departments.write", module: "departments", action: "write", description: "Create/Edit departments" },
  { name: "departments.delete", module: "departments", action: "delete", description: "Delete departments" },
  { name: "attendance.mark", module: "attendance", action: "mark", description: "Mark own attendance" },
  { name: "attendance.view", module: "attendance", action: "view", description: "View attendance records" },
  { name: "attendance.read", module: "attendance", action: "read", description: "Read attendance" },
  { name: "attendance.manage", module: "attendance", action: "manage", description: "Manage all attendance" },
  { name: "leave.apply", module: "leave", action: "apply", description: "Apply for leave" },
  { name: "leave.view", module: "leave", action: "view", description: "View leave requests" },
  { name: "leave.read", module: "leave", action: "read", description: "Read leave balances" },
  { name: "leave.approve", module: "leave", action: "approve", description: "Approve/Reject leave" },
  { name: "leave.manage", module: "leave", action: "manage", description: "Manage all leaves" },
  { name: "payroll.view", module: "payroll", action: "view", description: "View payroll" },
  { name: "payroll.process", module: "payroll", action: "process", description: "Process payroll" },
  { name: "reports.view", module: "reports", action: "view", description: "View reports" },
  { name: "reports.generate", module: "reports", action: "generate", description: "Generate reports" },
  { name: "reports.export", module: "reports", action: "export", description: "Export reports" },
  { name: "reports.manage", module: "reports", action: "manage", description: "Manage reports and templates" },
  { name: "users.read", module: "users", action: "read", description: "View users" },
  { name: "users.write", module: "users", action: "write", description: "Create/Edit users" },
  { name: "users.delete", module: "users", action: "delete", description: "Delete users" },
  { name: "profile.read", module: "profile", action: "read", description: "View own profile" },
  { name: "profile.write", module: "profile", action: "write", description: "Edit own profile" },
  { name: "timesheet.create", module: "timesheet", action: "create", description: "Create timesheets" },
  { name: "timesheet.view", module: "timesheet", action: "view", description: "View timesheets" },
  { name: "timesheet.approve", module: "timesheet", action: "approve", description: "Approve timesheets" },
  { name: "timesheet.manage", module: "timesheet", action: "manage", description: "Manage all timesheets" },
  { name: "assets.view", module: "assets", action: "view", description: "View assets" },
  { name: "assets.manage", module: "assets", action: "manage", description: "Manage assets" },
  { name: "expenses.submit", module: "expenses", action: "submit", description: "Submit expenses" },
  { name: "expenses.view", module: "expenses", action: "view", description: "View expenses" },
  { name: "expenses.approve", module: "expenses", action: "approve", description: "Approve expenses" },
  { name: "documents.view", module: "documents", action: "view", description: "View documents" },
  { name: "documents.manage", module: "documents", action: "manage", description: "Manage documents" },
  { name: "announcements.view", module: "announcements", action: "view", description: "View announcements" },
  { name: "announcements.create", module: "announcements", action: "create", description: "Create announcements" },
  { name: "announcements.edit", module: "announcements", action: "edit", description: "Edit announcements" },
  { name: "announcements.delete", module: "announcements", action: "delete", description: "Delete announcements" },
  { name: "announcements.publish", module: "announcements", action: "publish", description: "Publish announcements" },
  { name: "onboarding.view", module: "onboarding", action: "view", description: "View onboarding" },
  { name: "onboarding.manage", module: "onboarding", action: "manage", description: "Manage onboarding" },
  { name: "notifications.view", module: "notifications", action: "view", description: "View notifications" },
  { name: "notifications.manage", module: "notifications", action: "manage", description: "Manage notification delivery and settings" },
  { name: "organization.view", module: "organization", action: "view", description: "View organization structure" },
  { name: "tasks.view", module: "tasks", action: "view", description: "View tasks" },
  { name: "tasks.create", module: "tasks", action: "create", description: "Create tasks" },
  { name: "tasks.edit", module: "tasks", action: "edit", description: "Edit tasks" },
  { name: "tasks.delete", module: "tasks", action: "delete", description: "Delete tasks" },
  { name: "tasks.manage", module: "tasks", action: "manage", description: "Manage all tasks" },
  { name: "expense.create", module: "expenses", action: "create", description: "Create expenses" },
  { name: "expense.submit", module: "expenses", action: "submit", description: "Submit expenses" },
  { name: "expense.view", module: "expenses", action: "view", description: "View own expenses" },
  { name: "expense.view_all", module: "expenses", action: "view_all", description: "View all expenses" },
  { name: "expense.edit", module: "expenses", action: "edit", description: "Edit expenses" },
  { name: "expense.approve", module: "expenses", action: "approve", description: "Approve/Reject expenses" },
  { name: "expense.pay", module: "expenses", action: "pay", description: "Mark expenses as paid" },
  { name: "majlis.institutions.read", module: "majlis", action: "institutions.read", description: "View institutions" },
  { name: "majlis.institutions.write", module: "majlis", action: "institutions.write", description: "Create/Edit institutions" },
  { name: "majlis.institutions.approve", module: "majlis", action: "institutions.approve", description: "Approve institutions" },
  { name: "majlis.institutions.delete", module: "majlis", action: "institutions.delete", description: "Delete institutions" },
  { name: "majlis.assignments.read", module: "majlis", action: "assignments.read", description: "View assignments" },
  { name: "majlis.assignments.write", module: "majlis", action: "assignments.write", description: "Create/Edit assignments" },
  { name: "majlis.assignments.approve", module: "majlis", action: "assignments.approve", description: "Approve assignments" },
  { name: "majlis.dashboard.view", module: "majlis", action: "dashboard.view", description: "View Majlis dashboard" },
  { name: "halal.business", module: "halal", action: "business", description: "Register business and apply for certification" },
  { name: "halal.competency", module: "halal", action: "competency", description: "Apply for Halal Competency Certificate (individual) and view own records" },
  { name: "halal.inspector", module: "halal", action: "inspector", description: "Perform inspections" },
  { name: "halal.review", module: "halal", action: "review", description: "Review applications" },
  { name: "halal.supervisor", module: "halal", action: "supervisor", description: "Supervisor approval for business details" },
  { name: "halal.committee", module: "halal", action: "committee", description: "Halal committee review and decisions" },
  { name: "halal.audit", module: "halal", action: "audit", description: "Audit halal workflow and compliance records" },
  { name: "halal.finance", module: "halal", action: "finance", description: "Approve manual payments for halal certification" },
  { name: "halal.admin", module: "halal", action: "admin", description: "Full halal certification control and final approval" },
  { name: "halal.approve", module: "halal", action: "approve", description: "Approve/reject applications" },
  { name: "halal.renew", module: "halal", action: "renew", description: "Process renewals" },
  { name: "majlis.membership.view", module: "majlis", action: "membership.view", description: "View members and subscriptions" },
  { name: "majlis.membership.register", module: "majlis", action: "membership.register", description: "Register members and process payments" },
  { name: "majlis.membership.admin", module: "majlis", action: "membership.admin", description: "Full membership admin and manual payment" },
  { name: "majlis.member", module: "majlis", action: "member", description: "Registered member - view profile, certificate, renew" },
];

export const ROLE_PERMISSIONS = {
  HR: ["dashboard.view", "employees.read", "employees.write", "employees.delete", "employees.id.manage", "employees.id.generate", "employees.id.batch", "departments.read", "departments.write", "attendance.mark", "attendance.view", "attendance.manage", "leave.apply", "leave.view", "leave.read", "leave.approve", "leave.manage", "payroll.view", "payroll.process", "reports.view", "reports.generate", "reports.export", "reports.manage", "users.read", "users.write", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "announcements.view", "announcements.create", "announcements.edit", "announcements.delete", "announcements.publish", "onboarding.view", "notifications.view", "notifications.manage", "organization.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.manage", "expense.create", "expense.submit", "expense.view", "expense.view_all", "expense.edit", "expense.approve", "expense.pay", "majlis.institutions.read", "majlis.institutions.write", "majlis.assignments.read", "majlis.assignments.write", "majlis.dashboard.view", "majlis.membership.view", "majlis.membership.register", "halal.business", "halal.competency", "halal.review", "halal.supervisor", "halal.committee", "halal.audit", "halal.inspector"],
  MANAGER: ["dashboard.view", "employees.read", "employees.id.generate", "departments.read", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "leave.read", "leave.approve", "payroll.view", "reports.view", "reports.generate", "reports.export", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "announcements.view", "announcements.create", "announcements.edit", "announcements.publish", "onboarding.view", "notifications.view", "organization.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.manage", "expense.create", "expense.submit", "expense.view", "expense.view_all", "expense.approve", "majlis.institutions.read", "majlis.assignments.read", "majlis.dashboard.view"],
  EMPLOYEE: ["dashboard.view", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "payroll.view", "reports.view", "profile.read", "profile.write", "timesheet.create", "timesheet.view", "documents.view", "announcements.view", "notifications.view", "tasks.view", "expense.create", "expense.submit", "expense.view", "halal.competency"],
  HALAL_BUSINESS: ["dashboard.view", "profile.read", "profile.write", "halal.business", "halal.competency"],
  /** Public registrants applying only for individual Halal competency (no business certification portal) */
  HALAL_COMPETENCY: ["dashboard.view", "profile.read", "profile.write", "halal.competency"],
  MAJLIS_REPRESENTATIVE: ["dashboard.view", "profile.read", "profile.write", "majlis.membership.view", "majlis.membership.register", "majlis.dashboard.view", "majlis.institutions.read", "majlis.assignments.read"],
  MEMBER: ["dashboard.view", "profile.read", "profile.write", "majlis.member"],
} as const;

export async function seedPermissionsAndRoleMappings(prisma: PrismaClient) {
  console.log("🔐 Seeding permissions...");

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }
  console.log(`✅ Created ${PERMISSIONS.length} permissions`);

  const roles = await prisma.role.findMany();

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: permission.id },
      });
    }
    console.log(`✅ Assigned ${allPermissions.length} permissions to ADMIN`);
  }

  for (const role of roles) {
    if (role.name === "ADMIN") continue;
    const permissionNames = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS];
    if (!permissionNames) continue;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissions = await prisma.permission.findMany({
      where: { name: { in: [...permissionNames] } },
    });
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`✅ Assigned ${permissions.length} permissions to ${role.name}`);
  }
}

