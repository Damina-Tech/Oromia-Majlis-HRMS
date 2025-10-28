import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define all permissions in the system
const PERMISSIONS = [
  // Dashboard
  { name: "dashboard.view", module: "dashboard", action: "view", description: "View dashboard" },
  
  // Employees
  { name: "employees.read", module: "employees", action: "read", description: "View employees" },
  { name: "employees.write", module: "employees", action: "write", description: "Create/Edit employees" },
  { name: "employees.delete", module: "employees", action: "delete", description: "Delete employees" },
  
  // Departments/Organization
  { name: "departments.read", module: "departments", action: "read", description: "View departments" },
  { name: "departments.write", module: "departments", action: "write", description: "Create/Edit departments" },
  { name: "departments.delete", module: "departments", action: "delete", description: "Delete departments" },
  
  // Attendance
  { name: "attendance.mark", module: "attendance", action: "mark", description: "Mark own attendance" },
  { name: "attendance.view", module: "attendance", action: "view", description: "View attendance records" },
  { name: "attendance.manage", module: "attendance", action: "manage", description: "Manage all attendance" },
  
  // Leave
  { name: "leave.apply", module: "leave", action: "apply", description: "Apply for leave" },
  { name: "leave.view", module: "leave", action: "view", description: "View leave requests" },
  { name: "leave.approve", module: "leave", action: "approve", description: "Approve/Reject leave" },
  { name: "leave.manage", module: "leave", action: "manage", description: "Manage all leaves" },
  
  // Payroll
  { name: "payroll.view", module: "payroll", action: "view", description: "View payroll" },
  { name: "payroll.process", module: "payroll", action: "process", description: "Process payroll" },
  
  // Reports
  { name: "reports.view", module: "reports", action: "view", description: "View reports" },
  { name: "reports.generate", module: "reports", action: "generate", description: "Generate reports" },
  
  // Users
  { name: "users.read", module: "users", action: "read", description: "View users" },
  { name: "users.write", module: "users", action: "write", description: "Create/Edit users" },
  { name: "users.delete", module: "users", action: "delete", description: "Delete users" },
  
  // Profile
  { name: "profile.read", module: "profile", action: "read", description: "View own profile" },
  { name: "profile.write", module: "profile", action: "write", description: "Edit own profile" },
  
  // Timesheet
  { name: "timesheet.create", module: "timesheet", action: "create", description: "Create timesheets" },
  { name: "timesheet.view", module: "timesheet", action: "view", description: "View timesheets" },
  { name: "timesheet.approve", module: "timesheet", action: "approve", description: "Approve timesheets" },
  { name: "timesheet.manage", module: "timesheet", action: "manage", description: "Manage all timesheets" },
  
  // Assets
  { name: "assets.view", module: "assets", action: "view", description: "View assets" },
  { name: "assets.manage", module: "assets", action: "manage", description: "Manage assets" },
  
  // Expenses
  { name: "expenses.submit", module: "expenses", action: "submit", description: "Submit expenses" },
  { name: "expenses.view", module: "expenses", action: "view", description: "View expenses" },
  { name: "expenses.approve", module: "expenses", action: "approve", description: "Approve expenses" },
  
  // Documents
  { name: "documents.view", module: "documents", action: "view", description: "View documents" },
  { name: "documents.manage", module: "documents", action: "manage", description: "Manage documents" },
  
  // Onboarding
  { name: "onboarding.view", module: "onboarding", action: "view", description: "View onboarding" },
  { name: "onboarding.manage", module: "onboarding", action: "manage", description: "Manage onboarding" },
  
  // Notifications
  { name: "notifications.view", module: "notifications", action: "view", description: "View notifications" },
  
  // Organization
  { name: "organization.view", module: "organization", action: "view", description: "View organization structure" },
];

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  ADMIN: [
    // Admin has ALL permissions
    ...PERMISSIONS.map(p => p.name),
  ],
  
  HR: [
    "dashboard.view",
    "employees.read",
    "employees.write",
    "employees.delete",
    "departments.read",
    "departments.write",
    "departments.delete",
    "attendance.mark",
    "attendance.view",
    "attendance.manage",
    "leave.apply",
    "leave.view",
    "leave.approve",
    "leave.manage",
    "payroll.read",
    "payroll.write",
    "reports.view",
    "reports.generate",
    "users.read",
    "users.write",
    "profile.read",
    "profile.write",
    "timesheet.create",
    "timesheet.view",
    "timesheet.approve",
    "timesheet.manage",
    "assets.view",
    "assets.manage",
    "expenses.view",
    "expenses.approve",
    "documents.view",
    "documents.manage",
    "onboarding.view",
    "onboarding.manage",
    "notifications.view",
    "organization.view",
  ],
  
  MANAGER: [
    "dashboard.view",
    "employees.read",
    "departments.read",
    "attendance.mark",
    "attendance.view",
    "leave.apply",
    "leave.view",
    "leave.approve",
    "payroll.read",
    "reports.view",
    "profile.read",
    "profile.write",
    "timesheet.create",
    "timesheet.view",
    "timesheet.approve",
    "assets.view",
    "expenses.view",
    "expenses.approve",
    "documents.view",
    "onboarding.view",
    "notifications.view",
    "organization.view",
  ],
  
  EMPLOYEE: [
    "dashboard.view",
    "attendance.mark",
    "attendance.view",
    "leave.apply",
    "leave.view",
    "payroll.read",
    "profile.read",
    "profile.write",
    "timesheet.create",
    "timesheet.view",
    "documents.view",
    "notifications.view",
  ],
};

async function seedPermissions() {
  console.log("🔐 Seeding permissions...");

  // Create all permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }

  console.log(`✅ Created ${PERMISSIONS.length} permissions`);

  // Get all roles
  const roles = await prisma.role.findMany();
  console.log(`📋 Found ${roles.length} roles`);

  // Assign permissions to roles
  for (const role of roles) {
    const permissionNames = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS];
    
    if (!permissionNames) {
      console.log(`⚠️  No permissions defined for role: ${role.name}`);
      continue;
    }

    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Create new role permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`✅ Assigned ${permissions.length} permissions to ${role.name}`);
  }

  console.log("🎉 Permission seeding completed!");
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

