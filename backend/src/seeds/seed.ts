import "dotenv/config";
import "reflect-metadata";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource, initializeDataSource } from "../db/data-source.js";
import { Role } from "../entities/Role.js";
import { Permission } from "../entities/Permission.js";
import { RolePermission } from "../entities/RolePermission.js";
import { User, UserStatus } from "../entities/User.js";
import { UserRole } from "../entities/UserRole.js";

async function up(): Promise<void> {
  await initializeDataSource();

  const roleRepo = AppDataSource.getRepository(Role);
  const permRepo = AppDataSource.getRepository(Permission);
  const rolePermRepo = AppDataSource.getRepository(RolePermission);
  const userRepo = AppDataSource.getRepository(User);
  const userRoleRepo = AppDataSource.getRepository(UserRole);

  const roleNames = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  const existingRoles = await roleRepo.find();
  const existingRoleNames = new Set(existingRoles.map((r) => r.name));

  const rolesToCreate: Role[] = [];
  for (const name of roleNames) {
    if (!existingRoleNames.has(name)) {
      const role = new Role();
      role.id = uuidv4();
      role.name = name;
      role.description = `${name} role`;
      rolesToCreate.push(role);
    }
  }
  if (rolesToCreate.length > 0) {
    await roleRepo.save(rolesToCreate);
  }

  const ensureRole = async (name: string): Promise<Role> => {
    let role = await roleRepo.findOne({ where: { name } });
    if (!role) {
      role = new Role();
      role.id = uuidv4();
      role.name = name;
      role.description = `${name} role`;
      await roleRepo.save(role);
    }
    return role;
  };

  // Example permissions (customize as needed)
  const basePermissions = [
    { module: "users", action: "read" },
    { module: "users", action: "write" },
    { module: "employees", action: "read" },
    { module: "employees", action: "write" },
  ];

  const existingPerms = await permRepo.find();
  const permKey = (p: Permission) => `${p.module}:${p.action}`;
  const existingPermKeys = new Set(existingPerms.map(permKey));

  const permsToCreate: Permission[] = [];
  for (const p of basePermissions) {
    const key = `${p.module}:${p.action}`;
    if (!existingPermKeys.has(key)) {
      const perm = new Permission();
      perm.id = uuidv4();
      perm.name = key;
      perm.module = p.module;
      perm.action = p.action;
      perm.description = `${p.action} access to ${p.module}`;
      permsToCreate.push(perm);
    }
  }
  if (permsToCreate.length > 0) {
    await permRepo.save(permsToCreate);
  }

  // Link ADMIN with all permissions
  const adminRole = await ensureRole("ADMIN");
  const allPerms = await permRepo.find();
  const existingRolePerms = await rolePermRepo.find({ where: { roleId: adminRole.id } });
  const have = new Set(existingRolePerms.map((rp) => `${rp.roleId}:${rp.permissionId}`));
  const links: RolePermission[] = [];
  for (const p of allPerms) {
    const key = `${adminRole.id}:${p.id}`;
    if (!have.has(key)) {
      const rp = new RolePermission();
      rp.roleId = adminRole.id;
      rp.permissionId = p.id;
      links.push(rp);
    }
  }
  if (links.length > 0) {
    await rolePermRepo.save(links);
  }

  // Create admin user if missing
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = new User();
    adminUser.id = uuidv4();
    adminUser.email = adminEmail;
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.status = UserStatus.ACTIVE;
    adminUser.passwordHash = await bcrypt.hash(adminPassword, 10);
    await userRepo.save(adminUser);

    const ur = new UserRole();
    ur.userId = adminUser.id;
    ur.roleId = adminRole.id;
    await userRoleRepo.save(ur);
  }
}

up()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });


