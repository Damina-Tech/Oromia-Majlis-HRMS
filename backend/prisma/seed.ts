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
    { name: "onboarding.view", module: "onboarding", action: "view", description: "View onboarding" },
    { name: "onboarding.manage", module: "onboarding", action: "manage", description: "Manage onboarding" },
    { name: "notifications.view", module: "notifications", action: "view", description: "View notifications" },
    { name: "organization.view", module: "organization", action: "view", description: "View organization structure" },
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
    HR: ["dashboard.view", "employees.read", "employees.write", "employees.delete", "departments.read", "departments.write", "attendance.mark", "attendance.view", "attendance.manage", "leave.apply", "leave.view", "leave.read", "leave.approve", "leave.manage", "payroll.view", "payroll.process", "reports.view", "users.read", "users.write", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "onboarding.view", "notifications.view", "organization.view"],
    MANAGER: ["dashboard.view", "employees.read", "departments.read", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "leave.read", "leave.approve", "payroll.view", "reports.view", "profile.read", "profile.write", "timesheet.view", "assets.view", "documents.view", "onboarding.view", "notifications.view", "organization.view"],
    EMPLOYEE: ["dashboard.view", "attendance.mark", "attendance.view", "leave.apply", "leave.view", "payroll.view", "profile.read", "profile.write", "timesheet.create", "timesheet.view", "documents.view", "notifications.view"],
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
