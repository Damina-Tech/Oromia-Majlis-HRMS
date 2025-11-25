import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedPermissions() {
  console.log("🔐 Seeding permissions...");
  
  const PERMISSIONS = [
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
  ];

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
  
  // Assign ALL permissions to ADMIN
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

  // Assign permissions to other roles
  const rolePermissions = {
    HR: ["dashboard.view", "employees.read", "employees.write", "employees.delete", "employees.id.manage", "employees.id.generate", "employees.id.batch", "departments.read", "departments.write", "attendance.mark", "attendance.view", "attendance.manage", "leave.apply", "leave.view", "leave.read", "leave.approve", "leave.manage", "payroll.view", "payroll.process", "reports.view", "reports.generate", "reports.export", "reports.manage", "users.read", "users.write", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "announcements.view", "announcements.create", "announcements.edit", "announcements.delete", "announcements.publish", "onboarding.view", "notifications.view", "notifications.manage", "organization.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.manage", "expense.create", "expense.submit", "expense.view", "expense.view_all", "expense.edit", "expense.approve", "expense.pay"],
    MANAGER: ["dashboard.view", "employees.read", "employees.id.generate", "departments.read", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "leave.read", "leave.approve", "payroll.view", "reports.view", "reports.generate", "reports.export", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "announcements.view", "announcements.create", "announcements.edit", "announcements.publish", "onboarding.view", "notifications.view", "organization.view", "tasks.view", "tasks.create", "tasks.edit", "tasks.manage", "expense.create", "expense.submit", "expense.view", "expense.view_all", "expense.approve"],
    EMPLOYEE: ["dashboard.view", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "payroll.view", "reports.view", "profile.read", "profile.write", "timesheet.create", "timesheet.view", "documents.view", "announcements.view", "notifications.view", "tasks.view", "expense.create", "expense.submit", "expense.view"],
  };

  for (const role of roles) {
    if (role.name === "ADMIN") continue; // Already handled
    
    const permissionNames = rolePermissions[role.name as keyof typeof rolePermissions];
    if (permissionNames) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      const permissions = await prisma.permission.findMany({
        where: { name: { in: permissionNames } },
      });
      for (const permission of permissions) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        });
      }
      console.log(`✅ Assigned ${permissions.length} permissions to ${role.name}`);
    }
  }
}

async function main() {
  console.log("Starting database seeding...");

  // Create roles
  const roles = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  for (const name of roles) {
    await prisma.role.upsert({ 
      where: { name }, 
      update: {}, 
      create: { name } 
    });
  }
  console.log("✅ Created roles:", roles.join(", "));

  // Seed permissions and assign to roles
  await seedPermissions();

  // Seed asset management data
  await seedAssets();

  // Seed document templates
  await seedDocumentTemplates();

  // Seed tasks
  await seedTasks();
  await seedExpenses();

  // Create departments
  const deptNames = ["Mayor Office", "HR", "Finance", "IT", "Infrastructure"];
  const depts = await Promise.all(
    deptNames.map(name => prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    }))
  );
  console.log("✅ Created departments:", deptNames.join(", "));

  // Create admin user
  const adminEmail = "admin@ciro.gov.et";
  const adminPassword = await bcrypt.hash("Admin12345!", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { 
      email: adminEmail, 
      passwordHash: adminPassword, 
      firstName: "System", 
      lastName: "Admin" 
    }
  });

  // Assign admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  }
  console.log("✅ Created admin user:", adminEmail);

  // Create admin employee record
  const adminEmp = await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      employeeCode: "EMP-000000",
      firstName: "System",
      lastName: "Admin",
      email: adminEmail,
      designation: "System Administrator",
      status: "ACTIVE",
      departmentId: depts[3].id, // IT department
      userId: admin.id,
      joiningDate: new Date(),
      salary: 50000.00,
    }
  });
  console.log("✅ Created admin employee:", adminEmp.employeeCode);

  // Seed ID card templates (after admin is created)
  await seedIdCardTemplates(admin);

  // Create manager user
  const managerEmail = "manager@ciro.gov.et";
  const managerPassword = await bcrypt.hash("Manager123!", 10);
  const managerUser = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: { 
      email: managerEmail, 
      passwordHash: managerPassword, 
      firstName: "Main", 
      lastName: "Manager" 
    }
  });

  // Assign manager role
  const managerRole = await prisma.role.findUnique({ where: { name: "MANAGER" } });
  if (managerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: managerUser.id, roleId: managerRole.id } },
      update: {},
      create: { userId: managerUser.id, roleId: managerRole.id },
    });
  }

  // Create manager employee record
  const managerEmp = await prisma.employee.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      employeeCode: "EMP-000001",
      firstName: "Main",
      lastName: "Manager",
      email: managerEmail,
      designation: "Department Manager",
      status: "ACTIVE",
      departmentId: depts[1].id, // HR department
      userId: managerUser.id,
      joiningDate: new Date(),
      salary: 35000.00,
    }
  });

  console.log("✅ Created manager employee:", managerEmp.employeeCode);

  // Create an employee user for testing
  const employeeEmail = "employee@ciro.gov.et";
  const employeePassword = await bcrypt.hash("Employee123!", 10);
  
  const employeeUser = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {},
    create: { 
      email: employeeEmail, 
      passwordHash: employeePassword, 
      firstName: "Test", 
      lastName: "Employee" 
    }
  });

  // Assign employee role
  const employeeRole = await prisma.role.findUnique({ where: { name: "EMPLOYEE" } });
  if (employeeRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: employeeUser.id, roleId: employeeRole.id } },
      update: {},
      create: { userId: employeeUser.id, roleId: employeeRole.id },
    });
  }

  // Create employee record
  const existingEmployee = await prisma.employee.findUnique({ where: { email: employeeEmail } });
  const employeeEmp = existingEmployee || await prisma.employee.create({
    data: {
      employeeCode: "EMP-000003",
      firstName: "Test",
      lastName: "Employee",
      email: employeeEmail,
      designation: "Software Developer",
      status: "ACTIVE",
      departmentId: depts[0].id, // IT department
      userId: employeeUser.id,
      managerId: managerEmp.id, // Reports to manager
      joiningDate: new Date(),
      salary: 25000.00,
    }
  });

  console.log("✅ Created employee:", employeeEmp.employeeCode);

  // Seed leads and related CRM data
  await seedLeads(admin, managerUser, employeeUser, depts);

  // Create additional department manager (Finance Department)
  const financeManagerEmail = "finance.manager@ciro.gov.et";
  const financeManagerPassword = await bcrypt.hash("FinanceMgr123!", 10);
  const financeManagerUser = await prisma.user.upsert({
    where: { email: financeManagerEmail },
    update: {},
    create: { 
      email: financeManagerEmail, 
      passwordHash: financeManagerPassword, 
      firstName: "Finance", 
      lastName: "Manager" 
    }
  });

  // Assign manager role to finance manager
  if (managerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: financeManagerUser.id, roleId: managerRole.id } },
      update: {},
      create: { userId: financeManagerUser.id, roleId: managerRole.id },
    });
  }

  // Create finance manager employee record
  const financeManagerEmp = await prisma.employee.upsert({
    where: { email: financeManagerEmail },
    update: {},
    create: {
      employeeCode: "EMP-000004",
      firstName: "Finance",
      lastName: "Manager",
      email: financeManagerEmail,
      designation: "Finance Department Manager",
      status: "ACTIVE",
      departmentId: depts[2].id, // Finance department
      userId: financeManagerUser.id,
      joiningDate: new Date(),
      salary: 40000.00,
    }
  });
  console.log("✅ Created finance manager:", financeManagerEmp.employeeCode);

  // Create additional employees under different managers
  const employee2Email = "john.doe@ciro.gov.et";
  const employee2Password = await bcrypt.hash("Employee123!", 10);
  const employee2User = await prisma.user.upsert({
    where: { email: employee2Email },
    update: {},
    create: { 
      email: employee2Email, 
      passwordHash: employee2Password, 
      firstName: "John", 
      lastName: "Doe" 
    }
  });

  // Assign employee role
  if (employeeRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: employee2User.id, roleId: employeeRole.id } },
      update: {},
      create: { userId: employee2User.id, roleId: employeeRole.id },
    });
  }

  const employee2Emp = await prisma.employee.upsert({
    where: { email: employee2Email },
    update: {},
    create: {
      employeeCode: "EMP-000005",
      firstName: "John",
      lastName: "Doe",
      email: employee2Email,
      designation: "Senior Developer",
      status: "ACTIVE",
      departmentId: depts[3].id, // IT department
      userId: employee2User.id,
      managerId: managerEmp.id, // Reports to manager
      joiningDate: new Date(),
      salary: 28000.00,
    }
  });
  console.log("✅ Created employee 2:", employee2Emp.employeeCode);

  // Create HR user
  const hrEmail = "hr@ciro.gov.et";
  const hrPassword = await bcrypt.hash("HrUser123!", 10);
  const hrUser = await prisma.user.upsert({
    where: { email: hrEmail },
    update: {},
    create: { 
      email: hrEmail, 
      passwordHash: hrPassword, 
      firstName: "HR", 
      lastName: "Specialist" 
    }
  });

  // Assign HR role
  const hrRole = await prisma.role.findUnique({ where: { name: "HR" } });
  if (hrRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: hrUser.id, roleId: hrRole.id } },
      update: {},
      create: { userId: hrUser.id, roleId: hrRole.id },
    });
  }

  const hrEmp = await prisma.employee.upsert({
    where: { email: hrEmail },
    update: {},
    create: {
      employeeCode: "EMP-000006",
      firstName: "HR",
      lastName: "Specialist",
      email: hrEmail,
      designation: "HR Specialist",
      status: "ACTIVE",
      departmentId: depts[1].id, // HR department
      userId: hrUser.id,
      joiningDate: new Date(),
      salary: 30000.00,
    }
  });
  console.log("✅ Created HR user:", hrEmp.employeeCode);

  // Create an employee under finance manager
  const financeEmployeeEmail = "finance.emp@ciro.gov.et";
  const financeEmployeePassword = await bcrypt.hash("FinanceEmp123!", 10);
  const financeEmployeeUser = await prisma.user.upsert({
    where: { email: financeEmployeeEmail },
    update: {},
    create: { 
      email: financeEmployeeEmail, 
      passwordHash: financeEmployeePassword, 
      firstName: "Finance", 
      lastName: "Employee" 
    }
  });

  if (employeeRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: financeEmployeeUser.id, roleId: employeeRole.id } },
      update: {},
      create: { userId: financeEmployeeUser.id, roleId: employeeRole.id },
    });
  }

  const financeEmployeeEmp = await prisma.employee.upsert({
    where: { email: financeEmployeeEmail },
    update: {},
    create: {
      employeeCode: "EMP-000007",
      firstName: "Finance",
      lastName: "Employee",
      email: financeEmployeeEmail,
      designation: "Accountant",
      status: "ACTIVE",
      departmentId: depts[2].id, // Finance department
      userId: financeEmployeeUser.id,
      managerId: financeManagerEmp.id, // Reports to finance manager
      joiningDate: new Date(),
      salary: 23000.00,
    }
  });
  console.log("✅ Created finance employee:", financeEmployeeEmp.employeeCode);

  // ========== PAYROLL MODULE SEED DATA ==========
  console.log("\n💰 Seeding Payroll Module...");

  // Create Salary Grades
  const grade1 = await prisma.salaryGrade.upsert({
    where: { code: "G1" },
    update: {},
    create: {
      name: "Grade 1",
      code: "G1",
      description: "Entry level positions",
      minSalary: new Prisma.Decimal(15000),
      maxSalary: new Prisma.Decimal(25000),
    },
  });

  const grade2 = await prisma.salaryGrade.upsert({
    where: { code: "G2" },
    update: {},
    create: {
      name: "Grade 2",
      code: "G2",
      description: "Mid-level positions",
      minSalary: new Prisma.Decimal(25000),
      maxSalary: new Prisma.Decimal(40000),
    },
  });

  const grade3 = await prisma.salaryGrade.upsert({
    where: { code: "G3" },
    update: {},
    create: {
      name: "Grade 3",
      code: "G3",
      description: "Senior positions",
      minSalary: new Prisma.Decimal(40000),
      maxSalary: new Prisma.Decimal(60000),
    },
  });

  console.log("✅ Created salary grades: G1, G2, G3");

  // Create Salary Steps for each grade
  const steps = [
    { grade: grade1, step: 1, salary: 15000 },
    { grade: grade1, step: 2, salary: 17500 },
    { grade: grade1, step: 3, salary: 20000 },
    { grade: grade1, step: 4, salary: 22500 },
    { grade: grade2, step: 1, salary: 25000 },
    { grade: grade2, step: 2, salary: 30000 },
    { grade: grade2, step: 3, salary: 35000 },
    { grade: grade3, step: 1, salary: 40000 },
    { grade: grade3, step: 2, salary: 50000 },
  ];

  for (const { grade, step, salary } of steps) {
    await prisma.salaryStep.upsert({
      where: {
        gradeId_step: {
          gradeId: grade.id,
          step: step,
        },
      },
      update: {},
      create: {
        gradeId: grade.id,
        step: step,
        salary: new Prisma.Decimal(salary),
      },
    });
  }
  console.log(`✅ Created ${steps.length} salary steps`);

  // Create Tax Rates (Ethiopian PAYE brackets - 2024)
  const taxRates = [
    { minIncome: 0, maxIncome: 600, rate: 0, fixedAmount: 0, year: 2024 },
    { minIncome: 601, maxIncome: 1650, rate: 10, fixedAmount: 0, year: 2024 },
    { minIncome: 1651, maxIncome: 3200, rate: 15, fixedAmount: 0, year: 2024 },
    { minIncome: 3201, maxIncome: 5250, rate: 20, fixedAmount: 0, year: 2024 },
    { minIncome: 5251, maxIncome: 7800, rate: 25, fixedAmount: 0, year: 2024 },
    { minIncome: 7801, maxIncome: 10900, rate: 30, fixedAmount: 0, year: 2024 },
    { minIncome: 10901, maxIncome: null, rate: 35, fixedAmount: 0, year: 2024 },
  ];

  for (const rate of taxRates) {
    // Check if exists first, then create or update
    const existing = await prisma.taxRate.findUnique({
      where: {
        year_minIncome: {
          year: rate.year,
          minIncome: new Prisma.Decimal(rate.minIncome),
        },
      },
    });

    if (existing) {
      await prisma.taxRate.update({
        where: { id: existing.id },
        data: {
          maxIncome: rate.maxIncome ? new Prisma.Decimal(rate.maxIncome) : null,
          rate: new Prisma.Decimal(rate.rate),
          fixedAmount: rate.fixedAmount ? new Prisma.Decimal(rate.fixedAmount) : null,
          isActive: true,
          description: `Tax bracket ${rate.minIncome} - ${rate.maxIncome || "above"}`,
        },
      });
    } else {
      await prisma.taxRate.create({
        data: {
          minIncome: new Prisma.Decimal(rate.minIncome),
          maxIncome: rate.maxIncome ? new Prisma.Decimal(rate.maxIncome) : null,
          rate: new Prisma.Decimal(rate.rate),
          fixedAmount: rate.fixedAmount ? new Prisma.Decimal(rate.fixedAmount) : null,
          year: rate.year,
          isActive: true,
          description: `Tax bracket ${rate.minIncome} - ${rate.maxIncome || "above"}`,
        },
      });
    }
  }
  console.log(`✅ Created ${taxRates.length} tax rate brackets for 2024`);

  // Create Pension Rate
  const existingPension = await prisma.pensionRate.findUnique({
    where: {
      year: 2024,
    },
  });

  if (existingPension) {
    await prisma.pensionRate.update({
      where: { id: existingPension.id },
      data: {
        employeeRate: new Prisma.Decimal(7.0),
        employerRate: new Prisma.Decimal(11.0),
        isActive: true,
        description: "Ethiopian pension contribution rates 2024",
      },
    });
  } else {
    await prisma.pensionRate.create({
      data: {
        employeeRate: new Prisma.Decimal(7.0), // 7% employee contribution
        employerRate: new Prisma.Decimal(11.0), // 11% employer contribution
        year: 2024,
        isActive: true,
        description: "Ethiopian pension contribution rates 2024",
      },
    });
  }
  console.log("✅ Created pension rate for 2024");

  // Create Allowances
  const allowances = [
    { name: "Transport Allowance", type: "TRANSPORT", amount: 2000, isPercentage: false },
    { name: "Housing Allowance", type: "HOUSING", amount: 5000, isPercentage: false },
    { name: "Meal Allowance", type: "MEAL", amount: 1500, isPercentage: false },
    { name: "Communication Allowance", type: "COMMUNICATION", amount: 1000, isPercentage: false },
    { name: "Medical Allowance", type: "MEDICAL", amount: 2000, isPercentage: false },
  ];

  for (const allowance of allowances) {
    await prisma.allowance.upsert({
      where: { name: allowance.name },
      update: {},
      create: {
        name: allowance.name,
        type: allowance.type as any,
        amount: new Prisma.Decimal(allowance.amount),
        isPercentage: allowance.isPercentage,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${allowances.length} allowance types`);

  // Create sample payroll runs and items
  console.log("\n📊 Creating sample payroll runs...");
  
  // Get all active employees
  const activeEmployees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: {
      salaryStep: true,
      salaryGrade: true,
      department: true,
    },
  });

  if (activeEmployees.length > 0) {
    // Create a sample payroll run for current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Check if payroll run already exists
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        periodType: "MONTHLY",
        periodStart,
        periodEnd,
      },
    });

    if (!existingRun) {
      const payrollRun = await prisma.payrollRun.create({
        data: {
          periodType: "MONTHLY",
          periodStart,
          periodEnd,
          paymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
          status: "DRAFT",
          employeeCount: activeEmployees.length,
        },
      });

      // Create payroll items for each employee
      for (const employee of activeEmployees) {
        const basicSalary = employee.salaryStep?.salary 
          ? parseFloat(employee.salaryStep.salary.toString())
          : employee.salary 
          ? parseFloat(employee.salary.toString())
          : 20000;

        // Calculate gross salary (basic + allowances)
        const transportAllowance = 2000;
        const housingAllowance = employee.salaryStep?.grade?.name === "G3" ? 5000 : 3000;
        const totalAllowances = transportAllowance + housingAllowance;
        const grossSalary = basicSalary + totalAllowances;

        // Calculate tax (simplified - 10% for this example)
        const incomeTax = grossSalary * 0.1;

        // Calculate pension (7% of basic salary)
        const pension = basicSalary * 0.07;

        // Other deductions
        const healthInsurance = 500;
        const providentFund = 1000;
        const totalDeductions = incomeTax + pension + healthInsurance + providentFund;
        const netSalary = grossSalary - totalDeductions;

        await prisma.payrollItem.create({
          data: {
            payrollRunId: payrollRun.id,
            employeeId: employee.id,
            basicSalary: new Prisma.Decimal(basicSalary),
            allowances: new Prisma.Decimal(totalAllowances),
            overtime: new Prisma.Decimal(0),
            bonus: new Prisma.Decimal(0),
            grossSalary: new Prisma.Decimal(grossSalary),
            incomeTax: new Prisma.Decimal(incomeTax),
            pension: new Prisma.Decimal(pension),
            healthInsurance: new Prisma.Decimal(healthInsurance),
            providentFund: new Prisma.Decimal(providentFund),
            loanDeductions: new Prisma.Decimal(0),
            advanceDeductions: new Prisma.Decimal(0),
            absenceDeductions: new Prisma.Decimal(0),
            otherDeductions: new Prisma.Decimal(0),
            totalDeductions: new Prisma.Decimal(totalDeductions),
            netSalary: new Prisma.Decimal(netSalary),
            workingDays: 22,
            presentDays: 20,
            absentDays: 1,
            leaveDays: 1,
          },
        });
      }

      // Update payroll run totals
      const allItems = await prisma.payrollItem.findMany({
        where: { payrollRunId: payrollRun.id },
      });

      const runTotalGross = allItems.reduce((sum, item) => sum + parseFloat(item.grossSalary.toString()), 0);
      const runTotalDeductions = allItems.reduce((sum, item) => sum + parseFloat(item.totalDeductions.toString()), 0);
      const runTotalNet = allItems.reduce((sum, item) => sum + parseFloat(item.netSalary.toString()), 0);

      await prisma.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          totalGross: new Prisma.Decimal(runTotalGross),
          totalDeductions: new Prisma.Decimal(runTotalDeductions),
          totalNet: new Prisma.Decimal(runTotalNet),
        },
      });

      console.log(`✅ Created sample payroll run for ${activeEmployees.length} employees`);
    } else {
      console.log("✅ Sample payroll run already exists for current month");
    }
  }

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📋 Test User Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔴 ADMIN ROLE:");
  console.log("   Email: admin@ciro.gov.et");
  console.log("   Password: Admin12345!");
  console.log("   Access: Full system access with all permissions");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🟡 DEPARTMENT MANAGER ROLES:");
  console.log("   1. Main Manager (HR Department):");
  console.log("      Email: manager@ciro.gov.et");
  console.log("      Password: Manager123!");
  console.log("   2. Finance Manager (Finance Department):");
  console.log("      Email: finance.manager@ciro.gov.et");
  console.log("      Password: FinanceMgr123!");
  console.log("   Access: Department management, team oversight");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🟢 EMPLOYEE ROLES:");
  console.log("   1. Test Employee (IT Department):");
  console.log("      Email: employee@ciro.gov.et");
  console.log("      Password: Employee123!");
  console.log("   2. John Doe (IT Department):");
  console.log("      Email: john.doe@ciro.gov.et");
  console.log("      Password: Employee123!");
  console.log("   3. Finance Employee (Finance Department):");
  console.log("      Email: finance.emp@ciro.gov.et");
  console.log("      Password: FinanceEmp123!");
  console.log("   Access: Basic employee features");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔵 HR ROLE:");
  console.log("   Email: hr@ciro.gov.et");
  console.log("   Password: HrUser123!");
  console.log("   Access: HR management features");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

async function seedAssets() {
  console.log("📦 Seeding asset management data...");
  
  // Create Asset Categories
  const categories = [
    { name: "Laptop", description: "Portable computers" },
    { name: "Desktop", description: "Desktop computers" },
    { name: "Monitor", description: "Computer monitors" },
    { name: "Printer", description: "Printing equipment" },
    { name: "Phone", description: "Mobile phones and smartphones" },
    { name: "Network Equipment", description: "Routers, switches, and networking devices" },
    { name: "Other", description: "Other equipment and assets" },
  ];
  
  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.assetCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }
  console.log(`✅ Created ${createdCategories.length} asset categories`);

  // Create Asset Locations
  const locations = [
    { name: "Main Office", address: "123 Main Street", type: "OFFICE" },
    { name: "Warehouse", address: "456 Storage Ave", type: "STORE" },
    { name: "Branch Office", address: "789 Branch Road", type: "BRANCH" },
  ];
  
  const createdLocations = [];
  for (const loc of locations) {
    // Check if location already exists by name
    const existing = await prisma.assetLocation.findFirst({
      where: { name: loc.name },
    });
    if (!existing) {
      const location = await prisma.assetLocation.create({
        data: loc,
      });
      createdLocations.push(location);
    } else {
      createdLocations.push(existing);
    }
  }
  console.log(`✅ Created/found ${createdLocations.length} asset locations`);

  // Create Asset Vendors
  const vendors = [
    { name: "Tech Supplies Inc.", contact: "John Doe", phone: "+1234567890", email: "sales@techsupplies.com" },
    { name: "Office Equipment Co.", contact: "Jane Smith", phone: "+0987654321", email: "info@officeequip.com" },
    { name: "Electronics Direct", contact: "Mike Johnson", phone: "+1122334455", email: "contact@electronics.com" },
  ];
  
  const createdVendors = [];
  for (const vendor of vendors) {
    const vendorRecord = await prisma.assetVendor.create({
      data: vendor,
    });
    createdVendors.push(vendorRecord);
  }
  console.log(`✅ Created ${createdVendors.length} asset vendors`);

  // Create sample assets (only if admin user exists)
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@ciro.gov.et" },
  });

  if (adminUser && createdCategories.length > 0 && createdLocations.length > 0) {
    const employees = await prisma.employee.findMany({ take: 5 });
    const laptopCategory = createdCategories.find((c) => c.name === "Laptop");
    const desktopCategory = createdCategories.find((c) => c.name === "Desktop");
    const monitorCategory = createdCategories.find((c) => c.name === "Monitor");
    
    if (laptopCategory && desktopCategory && monitorCategory) {
      // Get more categories
      const printerCategory = createdCategories.find((c) => c.name === "Printer");
      const phoneCategory = createdCategories.find((c) => c.name === "Phone");
      const networkCategory = createdCategories.find((c) => c.name === "Network Equipment");
      const otherCategory = createdCategories.find((c) => c.name === "Other");
      
      // Get departments
      const departments = await prisma.department.findMany({ take: 3 });
      
      const sampleAssets = [
        {
          name: "MacBook Pro 16-inch",
          categoryId: laptopCategory.id,
          brand: "Apple",
          model: "MacBook Pro 16",
          serialNumber: `MBP16-${Date.now()}-001`,
          purchaseDate: new Date("2024-01-15"),
          purchasePrice: new Prisma.Decimal("2499.00"),
          currency: "USD",
          vendorId: createdVendors[0]?.id,
          warrantyUntil: new Date("2027-01-15"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[0]?.id,
          condition: "NEW",
          status: "ASSIGNED",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("20.00"),
          lifeYears: new Prisma.Decimal("4.00"),
          notes: "High-performance laptop for development team",
          createdBy: adminUser.id,
          assignedToEmployeeId: employees[0]?.id,
        },
        {
          name: "Dell OptiPlex Desktop",
          categoryId: desktopCategory.id,
          brand: "Dell",
          model: "OptiPlex 7090",
          serialNumber: `DELL-${Date.now()}-002`,
          purchaseDate: new Date("2024-02-20"),
          purchasePrice: new Prisma.Decimal("899.00"),
          currency: "USD",
          vendorId: createdVendors[1]?.id,
          warrantyUntil: new Date("2027-02-20"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[0]?.id,
          condition: "GOOD",
          status: "ASSIGNED",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("25.00"),
          lifeYears: new Prisma.Decimal("4.00"),
          notes: "Standard office desktop",
          createdBy: adminUser.id,
          assignedToEmployeeId: employees[1]?.id,
        },
        {
          name: "LG 27-inch Monitor",
          categoryId: monitorCategory.id,
          brand: "LG",
          model: "27UP850-W",
          serialNumber: `LG-MON-${Date.now()}-003`,
          purchaseDate: new Date("2024-03-10"),
          purchasePrice: new Prisma.Decimal("399.00"),
          currency: "USD",
          vendorId: createdVendors[0]?.id,
          locationId: createdLocations[0]?.id,
          departmentId: departments[1]?.id,
          condition: "NEW",
          status: "IN_STOCK",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("33.33"),
          lifeYears: new Prisma.Decimal("3.00"),
          notes: "4K monitor for design team",
          createdBy: adminUser.id,
        },
        {
          name: "HP LaserJet Printer",
          categoryId: printerCategory?.id,
          brand: "HP",
          model: "LaserJet Pro M404dn",
          serialNumber: `HP-PRT-${Date.now()}-004`,
          purchaseDate: new Date("2024-04-05"),
          purchasePrice: new Prisma.Decimal("299.00"),
          currency: "USD",
          vendorId: createdVendors[1]?.id,
          warrantyUntil: new Date("2026-04-05"),
          locationId: createdLocations[1]?.id,
          departmentId: departments[1]?.id,
          condition: "NEW",
          status: "IN_STOCK",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("33.33"),
          lifeYears: new Prisma.Decimal("3.00"),
          notes: "Network printer for office use",
          createdBy: adminUser.id,
        },
        {
          name: "iPhone 15 Pro",
          categoryId: phoneCategory?.id,
          brand: "Apple",
          model: "iPhone 15 Pro",
          serialNumber: `IPH15-${Date.now()}-005`,
          purchaseDate: new Date("2024-05-12"),
          purchasePrice: new Prisma.Decimal("999.00"),
          currency: "USD",
          vendorId: createdVendors[0]?.id,
          warrantyUntil: new Date("2027-05-12"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[0]?.id,
          condition: "NEW",
          status: "ASSIGNED",
          depreciationMethod: "DECLINING_BALANCE",
          depreciationRate: new Prisma.Decimal("40.00"),
          lifeYears: new Prisma.Decimal("3.00"),
          notes: "Company phone for sales manager",
          createdBy: adminUser.id,
          assignedToEmployeeId: employees[2]?.id,
        },
        {
          name: "Cisco Network Switch",
          categoryId: networkCategory?.id,
          brand: "Cisco",
          model: "Catalyst 2960",
          serialNumber: `CISCO-${Date.now()}-006`,
          purchaseDate: new Date("2024-01-30"),
          purchasePrice: new Prisma.Decimal("1200.00"),
          currency: "USD",
          vendorId: createdVendors[2]?.id,
          warrantyUntil: new Date("2027-01-30"),
          locationId: createdLocations[2]?.id,
          departmentId: departments[2]?.id,
          condition: "GOOD",
          status: "IN_STOCK",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("20.00"),
          lifeYears: new Prisma.Decimal("5.00"),
          notes: "24-port network switch for branch office",
          createdBy: adminUser.id,
        },
        {
          name: "ThinkPad X1 Carbon",
          categoryId: laptopCategory.id,
          brand: "Lenovo",
          model: "ThinkPad X1 Carbon Gen 11",
          serialNumber: `LEN-${Date.now()}-007`,
          purchaseDate: new Date("2024-06-01"),
          purchasePrice: new Prisma.Decimal("1599.00"),
          currency: "USD",
          vendorId: createdVendors[1]?.id,
          warrantyUntil: new Date("2027-06-01"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[1]?.id,
          condition: "NEW",
          status: "ASSIGNED",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("20.00"),
          lifeYears: new Prisma.Decimal("4.00"),
          notes: "Lightweight business laptop",
          createdBy: adminUser.id,
          assignedToEmployeeId: employees[3]?.id,
        },
        {
          name: "Dell UltraSharp Monitor",
          categoryId: monitorCategory.id,
          brand: "Dell",
          model: "U2723DE",
          serialNumber: `DELL-MON-${Date.now()}-008`,
          purchaseDate: new Date("2024-07-15"),
          purchasePrice: new Prisma.Decimal("449.00"),
          currency: "USD",
          vendorId: createdVendors[1]?.id,
          warrantyUntil: new Date("2027-07-15"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[0]?.id,
          condition: "NEW",
          status: "IN_STOCK",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("33.33"),
          lifeYears: new Prisma.Decimal("3.00"),
          notes: "27-inch QHD monitor for office",
          createdBy: adminUser.id,
        },
        {
          name: "Samsung Galaxy Tab S9",
          categoryId: phoneCategory?.id || otherCategory?.id,
          brand: "Samsung",
          model: "Galaxy Tab S9",
          serialNumber: `SAM-TAB-${Date.now()}-009`,
          purchaseDate: new Date("2024-08-20"),
          purchasePrice: new Prisma.Decimal("799.00"),
          currency: "USD",
          vendorId: createdVendors[0]?.id,
          warrantyUntil: new Date("2027-08-20"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[1]?.id,
          condition: "NEW",
          status: "ASSIGNED",
          depreciationMethod: "DECLINING_BALANCE",
          depreciationRate: new Prisma.Decimal("35.00"),
          lifeYears: new Prisma.Decimal("3.00"),
          notes: "Tablet for field work and presentations",
          createdBy: adminUser.id,
          assignedToEmployeeId: employees[4]?.id || employees[0]?.id,
        },
        {
          name: "Logitech MX Master 3 Mouse",
          categoryId: otherCategory?.id || createdCategories[0]?.id,
          brand: "Logitech",
          model: "MX Master 3",
          serialNumber: `LOG-MOU-${Date.now()}-010`,
          purchaseDate: new Date("2024-09-10"),
          purchasePrice: new Prisma.Decimal("99.00"),
          currency: "USD",
          vendorId: createdVendors[1]?.id,
          warrantyUntil: new Date("2026-09-10"),
          locationId: createdLocations[0]?.id,
          departmentId: departments[2]?.id,
          condition: "NEW",
          status: "IN_STOCK",
          depreciationMethod: "STRAIGHT_LINE",
          depreciationRate: new Prisma.Decimal("40.00"),
          lifeYears: new Prisma.Decimal("2.50"),
          notes: "Premium wireless mouse for productivity",
          createdBy: adminUser.id,
        },
      ];

      // Generate asset codes and create assets
      for (let i = 0; i < sampleAssets.length; i++) {
        const assetData = sampleAssets[i];
        const year = new Date().getFullYear();
        // Get category name for code generation
        const category = createdCategories.find(c => c.id === assetData.categoryId);
        const categoryCode = category ? category.name.substring(0, 3).toUpperCase().padEnd(3, 'X') : 'OTH';
        const existingCount = await prisma.asset.count({
          where: {
            assetCode: { startsWith: `CHIRO-${year}-${categoryCode}-` },
          },
        });
        const sequence = (existingCount + 1).toString().padStart(4, "0");
        const assetCode = `CHIRO-${year}-${categoryCode}-${sequence}`;

        const createdAsset = await prisma.asset.create({
          data: {
            ...assetData,
            assetCode,
          },
        });

        // Create assignment record if assigned
        if (assetData.assignedToEmployeeId) {
          await prisma.assetAssignment.create({
            data: {
              assetId: createdAsset.id,
              employeeId: assetData.assignedToEmployeeId,
              assignedAt: new Date(),
              assignedBy: adminUser.id,
              note: "Initial assignment",
            },
          });

          // Create history entry
          await prisma.assetHistory.create({
            data: {
              assetId: createdAsset.id,
              action: "ASSIGNED",
              description: `Asset assigned during seeding`,
              toEmployeeId: assetData.assignedToEmployeeId,
              performedBy: adminUser.id,
            },
          });
        }

        // Create history entry for asset creation
        await prisma.assetHistory.create({
          data: {
            assetId: createdAsset.id,
            action: "CREATED",
            description: `Asset ${createdAsset.name} created`,
            performedBy: adminUser.id,
          },
        });
      }
      
      console.log(`✅ Created ${sampleAssets.length} sample assets`);
    }
  }

  console.log("✅ Asset management seeding completed");
}

async function seedDocumentTemplates() {
  console.log("📄 Seeding document templates...");

  // Get admin user for createdBy
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@ciro.gov.et" },
  });

  if (!adminUser) {
    console.log("⚠️  Admin user not found, skipping document templates seeding");
    return;
  }

  // Template 1: Offer Letter
  const offerLetterTemplate = await prisma.documentTemplate.upsert({
    where: { code: "OFFER_LETTER" },
    update: {},
    create: {
      code: "OFFER_LETTER",
      name: "Job Offer Letter",
      category: "HR",
      description: "Standard job offer letter template",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin-bottom: 10px;">CHIRO HRMS</h1>
            <p style="color: #6b7280;">Official Offer Letter</p>
          </div>
          
          <p style="margin-bottom: 10px;"><strong>Date:</strong> {{date.today}}</p>
          
          <p style="margin-bottom: 20px;">
            <strong>{{employee.fullName}}</strong><br>
            {{employee.address}}<br>
            Email: {{employee.email}}<br>
            Phone: {{employee.phone}}
          </p>
          
          <p style="margin-bottom: 20px;">Dear {{employee.firstName}},</p>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            We are pleased to offer you the position of <strong>{{employee.designation}}</strong> at {{company.name}}.
          </p>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            <strong>Position Details:</strong><br>
            - Designation: {{employee.designation}}<br>
            - Department: {{employee.department}}<br>
            - Employee Code: {{employee.employeeCode}}<br>
            - Joining Date: {{employee.joiningDate}}<br>
            - Reporting Manager: {{employee.manager}}
          </p>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            <strong>Compensation:</strong><br>
            - Basic Salary: {{payroll.basicSalary}} ETB<br>
            - Gross Salary: {{payroll.grossSalary}} ETB<br>
            - Net Salary: {{payroll.netSalary}} ETB
          </p>
          
          <p style="margin-bottom: 20px; line-height: 1.6;">
            We are excited to have you join our team and look forward to your positive response.
          </p>
          
          <p style="margin-bottom: 5px;">Sincerely,</p>
          <p style="margin-bottom: 5px;"><strong>HR Department</strong></p>
          <p><strong>{{company.name}}</strong></p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              {{company.name}}<br>
              {{company.address}}<br>
              Phone: {{company.phone}} | Email: {{company.email}}
            </p>
          </div>
        </div>
      `,
      language: "EN",
      tags: ["offer", "letter", "hr", "recruitment"],
      status: "ACTIVE",
      active: true,
      createdBy: adminUser.id,
      mergeFields: {
        fields: [
          "employee.fullName",
          "employee.firstName",
          "employee.designation",
          "employee.department",
          "employee.employeeCode",
          "employee.joiningDate",
          "employee.manager",
          "payroll.basicSalary",
          "payroll.grossSalary",
          "payroll.netSalary",
          "company.name",
          "company.address",
          "company.phone",
          "company.email",
          "date.today",
        ],
      },
    },
  });

  // Template 2: Appointment Letter
  const appointmentLetterTemplate = await prisma.documentTemplate.upsert({
    where: { code: "APPOINTMENT_LETTER" },
    update: {},
    create: {
      code: "APPOINTMENT_LETTER",
      name: "Appointment Letter",
      category: "HR",
      description: "Official appointment confirmation letter",
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin-bottom: 10px;">APPOINTMENT LETTER</h1>
            <p style="color: #6b7280;">{{company.name}}</p>
          </div>
          
          <p style="margin-bottom: 10px;"><strong>Ref No:</strong> APT-{{date.year}}-{{employee.employeeCode}}</p>
          <p style="margin-bottom: 10px;"><strong>Date:</strong> {{date.today}}</p>
          
          <p style="margin-bottom: 20px;">
            <strong>To:</strong><br>
            {{employee.fullName}}<br>
            {{employee.address}}
          </p>
          
          <p style="margin-bottom: 20px;">Dear {{employee.firstName}},</p>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            Following your successful interview and acceptance of our offer, we are pleased to confirm your appointment as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department, effective from <strong>{{employee.joiningDate}}</strong>.
          </p>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            <strong>Terms of Appointment:</strong>
          </p>
          
          <ul style="margin-bottom: 20px; line-height: 1.8; padding-left: 20px;">
            <li>Employee Code: <strong>{{employee.employeeCode}}</strong></li>
            <li>Designation: <strong>{{employee.designation}}</strong></li>
            <li>Department: <strong>{{employee.department}}</strong></li>
            <li>Reporting Manager: <strong>{{employee.manager}}</strong></li>
            <li>Salary: <strong>{{payroll.grossSalary}} ETB</strong> (Gross)</li>
            <li>Monthly Net Salary: <strong>{{payroll.netSalary}} ETB</strong></li>
          </ul>
          
          <p style="margin-bottom: 15px; line-height: 1.6;">
            This appointment is subject to the terms and conditions outlined in the employee handbook and your employment contract.
          </p>
          
          <p style="margin-bottom: 20px; line-height: 1.6;">
            We welcome you to {{company.name}} and look forward to a successful and productive association.
          </p>
          
          <p style="margin-bottom: 5px;">Yours sincerely,</p>
          <p style="margin-bottom: 5px;"><strong>Human Resources Department</strong></p>
          <p><strong>{{company.name}}</strong></p>
          
          <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              {{company.address}} | {{company.phone}} | {{company.email}}
            </p>
          </div>
        </div>
      `,
      language: "EN",
      tags: ["appointment", "letter", "hr", "confirmation"],
      status: "ACTIVE",
      active: true,
      createdBy: adminUser.id,
      mergeFields: {
        fields: [
          "employee.fullName",
          "employee.firstName",
          "employee.employeeCode",
          "employee.designation",
          "employee.department",
          "employee.manager",
          "employee.joiningDate",
          "employee.address",
          "payroll.grossSalary",
          "payroll.netSalary",
          "company.name",
          "company.address",
          "company.phone",
          "company.email",
          "date.today",
          "date.year",
        ],
      },
    },
  });

  // Template 3: Experience Certificate
  const experienceCertificateTemplate = await prisma.documentTemplate.upsert({
    where: { code: "EXPERIENCE_CERTIFICATE" },
    update: {},
    create: {
      code: "EXPERIENCE_CERTIFICATE",
      name: "Experience Certificate",
      category: "CERTIFICATE",
      description: "Work experience certificate for employees",
      content: `
        <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 2px solid #1e40af;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e40af; margin-bottom: 10px; font-size: 28px;">CERTIFICATE OF EXPERIENCE</h1>
            <div style="width: 100px; height: 2px; background: #1e40af; margin: 0 auto;"></div>
          </div>
          
          <p style="margin-bottom: 20px; text-align: center; font-size: 14px;">
            <strong>Certificate No:</strong> EXP-{{date.year}}-{{employee.employeeCode}}
          </p>
          
          <p style="margin-bottom: 30px; line-height: 1.8; text-align: justify; font-size: 16px;">
            This is to certify that <strong>{{employee.fullName}}</strong> (Employee Code: {{employee.employeeCode}}) 
            was employed with <strong>{{company.name}}</strong> as <strong>{{employee.designation}}</strong> 
            in the <strong>{{employee.department}}</strong> department from <strong>{{employee.joiningDate}}</strong> 
            until <strong>{{date.today}}</strong>.
          </p>
          
          <p style="margin-bottom: 20px; line-height: 1.8; text-align: justify; font-size: 16px;">
            During the period of employment, {{employee.firstName}} demonstrated professionalism, dedication, 
            and commitment to their duties. {{employee.firstName}}'s performance was consistently satisfactory, 
            and they maintained good conduct throughout their tenure.
          </p>
          
          <p style="margin-bottom: 20px; line-height: 1.8; text-align: justify; font-size: 16px;">
            This certificate is issued upon request and confirms that {{employee.firstName}} left the organization 
            on good terms. We wish {{employee.firstName}} success in all future endeavors.
          </p>
          
          <div style="margin-top: 60px;">
            <p style="margin-bottom: 40px; text-align: right;">
              <strong>Authorized Signatory</strong><br>
              <strong>Human Resources Department</strong><br>
              <strong>{{company.name}}</strong>
            </p>
            
            <p style="text-align: right; margin-top: 30px;">
              <strong>Date:</strong> {{date.today}}
            </p>
          </div>
          
          <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              {{company.name}}<br>
              {{company.address}}<br>
              Phone: {{company.phone}} | Email: {{company.email}}
            </p>
          </div>
        </div>
      `,
      language: "EN",
      tags: ["certificate", "experience", "hr", "verification"],
      status: "ACTIVE",
      active: true,
      createdBy: adminUser.id,
      mergeFields: {
        fields: [
          "employee.fullName",
          "employee.firstName",
          "employee.employeeCode",
          "employee.designation",
          "employee.department",
          "employee.joiningDate",
          "company.name",
          "company.address",
          "company.phone",
          "company.email",
          "date.today",
          "date.year",
        ],
      },
    },
  });

  console.log("✅ Created 3 document templates");

  // Generate sample documents for some employees
  if (adminUser) {
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      take: 3,
    });

    if (employees.length > 0) {
      console.log("📝 Generating sample documents...");

      // Import template engine and PDF generator
      const { processTemplate } = await import("../src/modules/documents/template-engine.js");
      const { generatePDFFromHTML, generateDocumentFileName } = await import(
        "../src/modules/documents/pdf-generator.js"
      );

      for (let i = 0; i < Math.min(employees.length, 3); i++) {
        const employee = employees[i];
        const template = i === 0 ? offerLetterTemplate : i === 1 ? appointmentLetterTemplate : experienceCertificateTemplate;

        try {
          // Process template
          const processedContent = await processTemplate(
            template.content,
            employee.id,
            undefined,
            false
          );

          // Generate PDF
          const fileName = generateDocumentFileName(template.code, employee.employeeCode);
          const pdfResult = await generatePDFFromHTML(processedContent, fileName);

          // Save generated document
          await prisma.generatedDocument.create({
            data: {
              templateId: template.id,
              employeeId: employee.id,
              generatedBy: adminUser.id,
              generatedFor: employee.id,
              fileUrl: pdfResult.filePath,
              fileName: pdfResult.fileName,
              format: "pdf",
              fileSize: pdfResult.fileSize,
              meta: {
                templateCode: template.code,
                templateName: template.name,
                employeeCode: employee.employeeCode,
              },
            },
          });

          console.log(`✅ Generated ${template.name} for ${employee.firstName} ${employee.lastName}`);
        } catch (error) {
          console.error(`❌ Failed to generate document for ${employee.firstName}:`, error);
        }
      }

      console.log("✅ Document generation completed");
    }
  }
}

async function seedIdCardTemplates(adminUser: { id: string }) {
  console.log("🪪 Seeding employee ID card templates...");
  
  const existing = await prisma.employeeIdTemplate.count();
  if (existing > 0) {
    console.log("ℹ️  Employee ID templates already exist, skipping seed.");
    return;
  }

  const templates = [
    {
      name: "Standard ID",
      description: "Default landscape employee ID card with photo on left",
      isDefault: true,
      settings: {
        size: "ID1",
        background: { type: "color", value: "#ffffff" },
        border: { width: 2, color: "#111827", radius: 20 },
        text: { color: "#0f172a", fontFamily: "Inter, sans-serif", fontSize: 14, headingSize: 22 },
        layout: "PHOTO_LEFT",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: true,
          showIssueDate: true,
          showExpiryDate: false,
          showBarcode: true,
          showSignature: false,
          showStamp: false,
        },
        codeType: "QR",
        extraLines: ["{{department}}", "ID: {{employeeCode}}"],
        assets: {},
      },
    },
    {
      name: "Professional ID",
      description: "Portrait-style ID card with photo on top",
      isDefault: false,
      settings: {
        size: "ID3",
        background: { type: "color", value: "#f8fafc" },
        border: { width: 3, color: "#1e40af", radius: 15 },
        text: { color: "#1e293b", fontFamily: "Arial, sans-serif", fontSize: 12, headingSize: 20 },
        layout: "PHOTO_TOP",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: true,
          showIssueDate: true,
          showExpiryDate: true,
          showBarcode: true,
          showSignature: true,
          showStamp: false,
        },
        codeType: "BARCODE",
        extraLines: ["{{department}}", "Employee ID: {{employeeCode}}"],
        assets: {},
      },
    },
    {
      name: "Compact ID",
      description: "Compact ID card with photo on right, minimal design",
      isDefault: false,
      settings: {
        size: "ID2",
        background: { type: "color", value: "#ffffff" },
        border: { width: 1, color: "#64748b", radius: 10 },
        text: { color: "#0f172a", fontFamily: "Roboto, sans-serif", fontSize: 13, headingSize: 18 },
        layout: "PHOTO_RIGHT",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: false,
          showIssueDate: true,
          showExpiryDate: false,
          showBarcode: true,
          showSignature: false,
          showStamp: false,
        },
        codeType: "QR",
        extraLines: ["{{department}}"],
        assets: {},
      },
    },
  ];

  for (const template of templates) {
    await prisma.employeeIdTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        isDefault: template.isDefault,
        settings: template.settings as Prisma.InputJsonValue,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      },
    });
  }
  
  console.log(`✅ Seeded ${templates.length} employee ID card templates`);
}

async function seedTasks() {
  console.log("📋 Seeding tasks...");

  // Get users and employees for task assignment
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@ciro.gov.et" },
  });
  
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    take: 10,
  });

  if (!adminUser || employees.length === 0) {
    console.log("⚠️  Skipping task seeding - no admin user or employees found");
    return;
  }

  // Get employee user IDs
  const employeeUsers = await prisma.user.findMany({
    where: {
      email: { in: employees.map((e) => e.email).filter(Boolean) },
    },
  });

  const employeeUserMap = new Map(
    employeeUsers.map((u) => [u.email, u.id])
  );

  // Sample tasks data
  const tasksData = [
    {
      title: "Complete Q4 Performance Reviews",
      description: "Review and complete performance evaluations for all team members for Q4 2024. Ensure all feedback is documented and submitted to HR.",
      project: "HR Management",
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      estimatedHours: 16,
      tags: ["performance", "reviews", "hr"],
    },
    {
      title: "Update Employee Handbook",
      description: "Review and update the employee handbook with latest policies and procedures. Include new remote work guidelines.",
      project: "HR Management",
      priority: "MEDIUM" as const,
      status: "TODO" as const,
      estimatedHours: 8,
      tags: ["documentation", "policies"],
    },
    {
      title: "Implement New Payroll System",
      description: "Migrate from legacy payroll system to new cloud-based solution. Coordinate with IT and Finance teams.",
      project: "Payroll System",
      priority: "URGENT" as const,
      status: "IN_PROGRESS" as const,
      estimatedHours: 40,
      tags: ["payroll", "migration", "system"],
    },
    {
      title: "Conduct Training Session on New HRMS Features",
      description: "Organize and conduct training sessions for all employees on new HRMS features including task management and announcements.",
      project: "Training",
      priority: "MEDIUM" as const,
      status: "REVIEW" as const,
      estimatedHours: 4,
      tags: ["training", "hrms"],
    },
    {
      title: "Review and Approve Leave Requests",
      description: "Review pending leave requests for December and January. Ensure proper coverage and approve/reject accordingly.",
      project: "Leave Management",
      priority: "HIGH" as const,
      status: "TODO" as const,
      estimatedHours: 2,
      tags: ["leave", "approval"],
    },
    {
      title: "Prepare Monthly Attendance Report",
      description: "Generate and analyze monthly attendance report. Identify patterns and address any attendance issues.",
      project: "Reports",
      priority: "MEDIUM" as const,
      status: "DONE" as const,
      estimatedHours: 3,
      actualHours: 2.5,
      tags: ["attendance", "reports"],
    },
    {
      title: "Update Employee Database",
      description: "Verify and update employee contact information, emergency contacts, and personal details in the system.",
      project: "Data Management",
      priority: "LOW" as const,
      status: "TODO" as const,
      estimatedHours: 6,
      tags: ["data", "maintenance"],
    },
    {
      title: "Plan Annual Company Event",
      description: "Coordinate with various departments to plan the annual company event. Book venue, arrange catering, and send invitations.",
      project: "Events",
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      estimatedHours: 20,
      tags: ["events", "planning"],
    },
    {
      title: "Audit Asset Inventory",
      description: "Conduct quarterly audit of all company assets. Verify physical assets match database records.",
      project: "Asset Management",
      priority: "HIGH" as const,
      status: "TODO" as const,
      estimatedHours: 12,
      tags: ["assets", "audit"],
    },
    {
      title: "Create Employee Onboarding Checklist",
      description: "Develop comprehensive onboarding checklist for new hires. Include all necessary steps and documentation.",
      project: "Onboarding",
      priority: "MEDIUM" as const,
      status: "DONE" as const,
      estimatedHours: 5,
      actualHours: 4.5,
      tags: ["onboarding", "checklist"],
    },
    {
      title: "Review and Update Job Descriptions",
      description: "Review all job descriptions and update them to reflect current responsibilities and requirements.",
      project: "HR Management",
      priority: "LOW" as const,
      status: "TODO" as const,
      estimatedHours: 10,
      tags: ["job-descriptions", "hr"],
    },
    {
      title: "Implement Employee Recognition Program",
      description: "Design and launch a new employee recognition program to boost morale and engagement.",
      project: "Employee Engagement",
      priority: "MEDIUM" as const,
      status: "REVIEW" as const,
      estimatedHours: 15,
      tags: ["recognition", "engagement"],
    },
  ];

  // Create tasks
  const createdTasks = [];
  const now = new Date();

  for (let i = 0; i < tasksData.length; i++) {
    const taskData = tasksData[i];
    const employee = employees[i % employees.length];
    const employeeUserId = employee.email ? employeeUserMap.get(employee.email) : null;

    // Set due dates (some in past, some in future)
    const daysOffset = i < 3 ? -i * 2 : i * 3; // First 3 are overdue/past due
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysOffset);

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (i % 5));

    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        project: taskData.project,
        priority: taskData.priority,
        status: taskData.status,
        startDate: startDate,
        dueDate: dueDate,
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours || null,
        tags: taskData.tags,
        createdBy: adminUser.id,
        completedBy: taskData.status === "DONE" ? adminUser.id : null,
        completedAt: taskData.status === "DONE" ? new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)) : null,
      },
    });

    // Assign task to employee
    if (employee && employeeUserId) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          employeeId: employee.id,
          assignedBy: adminUser.id,
          isUnread: i < 5, // First 5 tasks are unread
        },
      });
    }

    // Add watchers (admin and sometimes another employee)
    await prisma.taskWatcher.create({
      data: {
        taskId: task.id,
        userId: adminUser.id,
      },
    });

    if (i % 3 === 0 && employeeUserId && employeeUserId !== adminUser.id) {
      await prisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: employeeUserId,
        },
      });
    }

    // Add activity log
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        type: "CREATED",
        actorId: adminUser.id,
        details: {
          title: task.title,
        },
      },
    });

    // Add comment to some tasks
    if (i % 2 === 0) {
      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          content: `Initial comment on ${task.title}. This task requires attention.`,
          createdBy: adminUser.id,
          mentions: [],
        },
      });

      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          type: "COMMENTED",
          actorId: adminUser.id,
          details: {
            comment: "Initial comment added",
          },
        },
      });
    }

    // Add time logs for completed tasks
    if (taskData.status === "DONE" && taskData.actualHours) {
      await prisma.taskTimeLog.create({
        data: {
          taskId: task.id,
          employeeId: employee.id,
          date: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)),
          hours: taskData.actualHours,
          description: `Time logged for completing ${task.title}`,
          loggedBy: adminUser.id,
        },
      });
    }

    createdTasks.push(task);
  }

  // Create some subtasks
  if (createdTasks.length >= 2) {
    const parentTask = createdTasks[0];
    const subtask = await prisma.task.create({
      data: {
        title: "Review performance review templates",
        description: "Check existing templates and update if needed",
        project: parentTask.project,
        priority: "MEDIUM" as const,
        status: "TODO" as const,
        parentTaskId: parentTask.id,
        createdBy: adminUser.id,
        tags: ["subtask"],
      },
    });

    if (employees[0]) {
      await prisma.taskAssignment.create({
        data: {
          taskId: subtask.id,
          employeeId: employees[0].id,
          assignedBy: adminUser.id,
        },
      });
    }
  }

  console.log(`✅ Created ${createdTasks.length} tasks with assignments, watchers, comments, and time logs`);
}

async function seedExpenses() {
  console.log("💰 Seeding expenses...");

  const existingExpenses = await prisma.expense.count();
  if (existingExpenses > 0) {
    console.log("ℹ️ Expenses already exist, skipping expense seeding");
    return;
  }

  // Get users and employees for expense submission
  const users = await prisma.user.findMany({
    include: {
      employee: true,
    },
  });

  const employees = await prisma.employee.findMany();
  const departments = await prisma.department.findMany();
  const assets = await prisma.asset.findMany();
  const vendors = await prisma.assetVendor.findMany();

  if (users.length === 0 || employees.length === 0 || departments.length === 0) {
    console.log("⚠️  Skipping expense seeding - insufficient data");
    return;
  }

  const expenseTypes = ["OPERATIONAL", "TRAVEL", "REIMBURSEMENT", "MAINTENANCE", "RENT", "UTILITIES", "OTHER"];
  const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"];
  const paymentMethods = ["CASH", "BANK_TRANSFER", "E_BIRR", "TELEBIRR", "OTHER"];

  const createdExpenses = [];

  // Create expenses for different users
  for (let i = 0; i < 15; i++) {
    const submitter = employees[Math.floor(Math.random() * Math.min(employees.length, 5))];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000; // 1000 to 51000
    const incurredDate = new Date();
    incurredDate.setDate(incurredDate.getDate() - Math.floor(Math.random() * 60)); // Last 60 days

    // Generate reference number
    const year = new Date().getFullYear();
    const sequence = (i + 1).toString().padStart(4, "0");
    const referenceNo = `EXP-${year}-${sequence}`;

    const expenseData: any = {
      referenceNo,
      title: `Expense ${i + 1}: ${expenseType.toLowerCase()} expense`,
      description: `Sample ${expenseType.toLowerCase()} expense for testing purposes`,
      amount,
      currency: "ETB",
      expenseType,
      status,
      incurredDate,
      submittedBy: submitter.id,
      departmentId: department.id,
    };

    // Randomly add asset or vendor
    if (Math.random() > 0.5 && assets.length > 0) {
      expenseData.assetId = assets[Math.floor(Math.random() * assets.length)].id;
    }
    if (Math.random() > 0.5 && vendors.length > 0) {
      expenseData.vendorId = vendors[Math.floor(Math.random() * vendors.length)].id;
    }
    if (Math.random() > 0.7) {
      expenseData.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    }

    // Add approval data if approved or paid
    if (status === "APPROVED" || status === "PAID") {
      const approver = employees.find((e) => e.id !== submitter.id) || employees[0];
      expenseData.approvedBy = approver.id;
      expenseData.approvedAt = new Date(incurredDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after submission
    }

    // Add payment data if paid
    if (status === "PAID") {
      const payer = employees.find((e) => e.id !== submitter.id && e.id !== expenseData.approvedBy) || employees[0];
      expenseData.paidBy = payer.id;
      expenseData.paidAt = new Date(expenseData.approvedAt.getTime() + 24 * 60 * 60 * 1000); // 1 day after approval
      expenseData.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    }

    const expense = await prisma.expense.create({
      data: expenseData,
    });

    // Create approval history
    if (status !== "DRAFT") {
      await prisma.expenseApproval.create({
        data: {
          expenseId: expense.id,
          approverId: submitter.id,
          action: "SUBMITTED",
          comment: "Expense submitted for approval",
        },
      });

      if (status === "APPROVED" || status === "PAID") {
        const approver = employees.find((e) => e.id === expense.approvedBy) || employees[0];
        await prisma.expenseApproval.create({
          data: {
            expenseId: expense.id,
            approverId: approver.id,
            action: "APPROVED",
            comment: "Expense approved for payment",
          },
        });
      } else if (status === "REJECTED") {
        const approver = employees.find((e) => e.id !== submitter.id) || employees[0];
        await prisma.expenseApproval.create({
          data: {
            expenseId: expense.id,
            approverId: approver.id,
            action: "REJECTED",
            comment: "Expense rejected - insufficient documentation",
          },
        });
      }
    }

    // Create payment record if paid
    if (status === "PAID") {
      const payer = employees.find((e) => e.id === expense.paidBy) || employees[0];
      await prisma.expensePayment.create({
        data: {
          expenseId: expense.id,
          paidAmount: expense.amount,
          paymentMethod: expense.paymentMethod || "CASH",
          paymentReference: `REF-${Date.now()}-${i}`,
          paidBy: payer.id,
          notes: `Payment processed for ${expense.title}`,
        },
      });
    }

    createdExpenses.push(expense);
  }

  console.log(`✅ Created ${createdExpenses.length} expenses with various statuses`);
}

async function seedLeads(
  adminUser: { id: string },
  managerUser: { id: string },
  employeeUser: { id: string },
  departments: Array<{ id: string; name: string }>
) {
  const existing = await prisma.lead.count();
  if (existing > 0) {
    console.log("ℹ️ Leads already exist, skipping lead seed.");
    return;
  }

  console.log("🌱 Seeding sample leads...");

  const departmentLookup = new Map(
    departments.map((dept) => [dept.name.toLowerCase(), dept.id])
  );

  const hours = (value: number) => value * 60 * 60 * 1000;
  const days = (value: number) => value * 24 * 60 * 60 * 1000;

  const samples = [
    {
      fullName: "Selam Teshome",
      email: "selam.teshome@demo-leads.com",
      phone: "+251 911 001 002",
      companyName: "Selam Export",
      location: "Adama",
      interest: "Core HR & Payroll",
      source: "Website",
      stage: "NEW",
      priority: "MEDIUM",
      tags: ["website", "hr"],
      notes: ["Signed up on landing page, awaiting qualification."],
    },
    {
      fullName: "Lensa Logistics PLC",
      email: "it@lensalogistics.com",
      phone: "+251 922 334 455",
      companyName: "Lensa Logistics",
      location: "Addis Ababa",
      interest: "Employee self-service portal",
      source: "Referral",
      stage: "CONTACTED",
      priority: "HIGH",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("hr"),
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + days(3)),
      tags: ["referral", "logistics"],
      notes: ["Initial discovery call complete. Requested pricing sheet."],
    },
    {
      fullName: "Blue Nile Manufacturing",
      email: "tech@bluenilemf.com",
      phone: "+251 913 556 789",
      companyName: "Blue Nile Manufacturing",
      location: "Bahir Dar",
      interest: "Time tracking & shop-floor attendance",
      source: "Trade Fair",
      stage: "QUALIFIED",
      priority: "HIGH",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("it"),
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + days(2)),
      tags: ["manufacturing", "attendance"],
      notes: ["Needs biometric integration demo."],
    },
    {
      fullName: "Green Fields Agritech",
      email: "ops@greenfields.ag",
      phone: "+251 945 112 233",
      companyName: "Green Fields Agritech",
      location: "Hawassa",
      interest: "Performance management",
      source: "Email Campaign",
      stage: "PROPOSAL_SENT",
      priority: "MEDIUM",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("hr"),
      lastContactedAt: new Date(Date.now() - days(2)),
      nextFollowUpAt: new Date(Date.now() + days(1)),
      tags: ["proposal", "agritech"],
      notes: ["Proposal shared, awaiting CFO approval."],
    },
    {
      fullName: "Aster Diagnostics",
      email: "admin@asterdx.com",
      phone: "+251 968 223 441",
      companyName: "Aster Diagnostics",
      location: "Dire Dawa",
      interest: "Document automation",
      source: "Partner",
      stage: "NEGOTIATION",
      priority: "HIGH",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("it"),
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + hours(12)),
      tags: ["negotiation", "healthcare"],
      notes: ["Legal review in progress, small pricing gap remaining."],
    },
    {
      fullName: "Quantum Retail Group",
      email: "people@quantumretail.com",
      phone: "+251 977 665 443",
      companyName: "Quantum Retail Group",
      location: "Mekelle",
      interest: "360° performance",
      source: "LinkedIn",
      stage: "READY_TO_CONVERT",
      priority: "HIGH",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("hr"),
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + hours(6)),
      tags: ["retail", "ready"],
      notes: ["Budget approved, waiting on exec signature."],
    },
    {
      fullName: "Axum Airlines",
      email: "procurement@axumair.com",
      phone: "+251 934 556 677",
      companyName: "Axum Airlines",
      location: "Addis Ababa",
      interest: "Payroll outsourcing",
      source: "Customer Event",
      stage: "CONVERTED",
      priority: "HIGH",
      assignedToUserId: managerUser.id,
      assignedDepartmentId: departmentLookup.get("finance"),
      lastContactedAt: new Date(),
      tags: ["converted", "aviation"],
      notes: ["Deal closed. Implementation kickoff scheduled."],
    },
    {
      fullName: "Unity Consultancy",
      email: "info@unityconsultancy.com",
      phone: "+251 901 223 344",
      companyName: "Unity Consultancy",
      location: "Addis Ababa",
      interest: "HR analytics",
      source: "Cold Outreach",
      stage: "ARCHIVED",
      priority: "LOW",
      assignedToUserId: employeeUser.id,
      assignedDepartmentId: departmentLookup.get("hr"),
      lastContactedAt: new Date(Date.now() - days(20)),
      tags: ["archived", "consulting"],
      notes: ["Paused initiative until next fiscal year."],
    },
  ];

  for (const sample of samples) {
    const lead = await prisma.lead.create({
      data: {
        fullName: sample.fullName,
        email: sample.email,
        phone: sample.phone,
        companyName: sample.companyName,
        location: sample.location,
        interest: sample.interest,
        source: sample.source,
        stage: sample.stage as Prisma.LeadStage,
        priority: sample.priority as Prisma.LeadPriority,
        status:
          sample.stage === "CONVERTED"
            ? "CONVERTED"
            : sample.stage === "ARCHIVED"
            ? "ARCHIVED"
            : "ACTIVE",
        tags: sample.tags ?? [],
        assignedToUserId: sample.assignedToUserId ?? null,
        assignedDepartmentId: sample.assignedDepartmentId ?? null,
        createdBy: adminUser.id,
        lastContactedAt: sample.lastContactedAt ?? null,
        nextFollowUpAt: sample.nextFollowUpAt ?? null,
        convertedAt: sample.stage === "CONVERTED" ? new Date() : null,
        archivedAt: sample.stage === "ARCHIVED" ? new Date() : null,
        potentialValue: sample.stage === "CONVERTED" ? 420000 : 120000,
      },
    });

    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        action: "CREATED",
        actorId: adminUser.id,
      },
    });

    if (sample.stage !== "NEW") {
      await prisma.leadHistory.create({
        data: {
          leadId: lead.id,
          action: "STAGE_CHANGED",
          actorId: sample.assignedToUserId ?? adminUser.id,
          toStage: sample.stage as Prisma.LeadStage,
        },
      });
    }

    if (sample.notes) {
      for (const note of sample.notes) {
        await prisma.leadNote.create({
          data: {
            leadId: lead.id,
            authorId: sample.assignedToUserId ?? adminUser.id,
            content: note,
          },
        });
      }
    }
  }

  await prisma.leadMetrics.deleteMany({ where: { scope: "GLOBAL" } });

  const [stageCounts, sourceCounts, totalLeads, convertedLeads] = await Promise.all([
    prisma.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { source: { not: null } },
      _count: { _all: true },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
  ]);

  await prisma.leadMetrics.create({
    data: {
      scope: "GLOBAL",
      funnel: stageCounts.map((row) => ({ stage: row.stage, count: row._count._all })) as Prisma.InputJsonValue,
      sources: sourceCounts.map((row) => ({ source: row.source, count: row._count._all })) as Prisma.InputJsonValue,
      totals: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: totalLeads ? convertedLeads / totalLeads : 0,
      } as Prisma.InputJsonValue,
    },
  });

  console.log(`✅ Seeded ${samples.length} leads with histories, notes, and metrics`);
}

main()
  .then(() => {
    console.log("Seeding finished");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
