import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

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
