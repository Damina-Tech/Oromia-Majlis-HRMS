import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureAdminPermissions() {
  console.log("🔐 Ensuring admin has all permissions...");

  // Get admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    console.error("❌ ADMIN role not found!");
    process.exit(1);
  }

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  console.log(`📋 Found ${allPermissions.length} permissions`);

  // Delete existing admin role permissions
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  console.log("🗑️  Cleared existing admin permissions");

  // Assign all permissions to admin
  for (const permission of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Assigned ${allPermissions.length} permissions to ADMIN role`);

  // Verify ID card permissions specifically
  const idPermissions = allPermissions.filter((p) => p.name.startsWith("employees.id"));
  console.log(`\n🪪 ID Card Permissions:`);
  idPermissions.forEach((p) => {
    console.log(`   - ${p.name}: ${p.description}`);
  });

  await prisma.$disconnect();
}

ensureAdminPermissions()
  .then(() => {
    console.log("\n🎉 Done! Admin permissions updated.");
    console.log("⚠️  Note: Users may need to log out and log back in to refresh their permissions.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

