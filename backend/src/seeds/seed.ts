import "dotenv/config";
import prisma from "../db/client.js";

import bcrypt from "bcrypt";

async function seed(): Promise<void> {
  // Create roles
  const roleNames = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} role`,
      },
    });
  }

  // Create permissions
  const basePermissions = [
    { module: "users", action: "read" },
    { module: "users", action: "write" },
    { module: "employees", action: "read" },
    { module: "employees", action: "write" },
  ];

  for (const p of basePermissions) {
    const key = `${p.module}:${p.action}`;
    await prisma.permission.upsert({
      where: { name: key },
      update: {},
      create: {
        name: key,
        module: p.module,
        action: p.action,
        description: `${p.action} access to ${p.module}`,
      },
    });
  }

  // Link ADMIN with all permissions
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    const allPerms = await prisma.permission.findMany();
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Create admin user if missing
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: "Admin",
        lastName: "User",
        status: "ACTIVE",
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });
    }
  }
}

seed()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
