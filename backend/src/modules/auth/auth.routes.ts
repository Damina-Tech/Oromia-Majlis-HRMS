import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
<<<<<<< HEAD
import { AppDataSource } from "../../db/data-source.js";
import { User } from "../../entities/User.js";
import { UserRole } from "../../entities/UserRole.js";
import { Role } from "../../entities/Role.js";
import { RolePermission } from "../../entities/RolePermission.js";
import { Permission } from "../../entities/Permission.js";
import { Employee } from "../../entities/Employee.js";
import { z } from "zod";

const r = Router();
=======
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();
>>>>>>> dev
const LoginDto = z.object({ email: z.string().email(), password: z.string().min(6) });

function signAccess(userId: string, roles: string[], permissions: string[], employeeId?: string) {
  const secret = process.env.JWT_ACCESS_SECRET || "your-access-secret";
<<<<<<< HEAD
  return jwt.sign({ id: userId, roles, permissions, employeeId }, secret, { expiresIn: "15m" });
=======
  return jwt.sign({ id: userId, roles, permissions, employeeId }, secret, { expiresIn: "2h" });
>>>>>>> dev
}
function signRefresh(userId: string, roles: string[], permissions: string[], employeeId?: string) {
  const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
  return jwt.sign({ id: userId, roles, permissions, employeeId }, secret, { expiresIn: "14d" });
}

<<<<<<< HEAD
r.post("/login", async (req, res) => {
  try {
    const { email, password } = LoginDto.parse(req.body);
    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({ 
      where: { email },
      relations: {
        userRoles: {
          role: {
            permissions: {
              permission: true
            }
          }
        }
      }
    });
    
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    
    const roles = user.userRoles.map((ur) => ur.role.name);
    
    // Get all permissions from all roles
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.name);
      });
    });
    const permissions = Array.from(permissionsSet);
    
    // Get employee if linked
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({ where: { userId: user.id } });
    const employeeId = employee?.id;
    
    const accessToken = signAccess(user.id, roles, permissions, employeeId);
    const refreshToken = signRefresh(user.id, roles, permissions, employeeId);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax", secure: false });
    res.json({ 
      accessToken, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
        employeeId 
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

r.post("/refresh", async (req, res) => {
=======
router.post("/login", async (req, res) => {
  const { email, password } = LoginDto.parse(req.body);
  const user = await prisma.user.findUnique({ 
    where: { email }, 
    include: { 
      userRoles: { 
        include: { 
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          } 
        } 
      },
      employee: true
    } 
  });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  
  // Check if user is active
  if (user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Account is inactive. Please contact your administrator." });
  }
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  
  const roles = user.userRoles.map((ur: any) => ur.role.name);
  const employeeId = user.employee?.id;
  
  // Get all permissions from all roles
  const permissionsSet = new Set<string>();
  user.userRoles.forEach((ur: any) => {
    ur.role.permissions.forEach((rp: any) => {
      permissionsSet.add(rp.permission.name);
    });
  });
  const permissions = Array.from(permissionsSet);
  
  const accessToken = signAccess(user.id, roles, permissions, employeeId);
  const refreshToken = signRefresh(user.id, roles, permissions, employeeId);
  res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax", secure: false });
  const avatarUrl = user.avatarUrl ?? user.employee?.avatarUrl ?? null;

  res.json({ 
    accessToken, 
    user: { 
      id: user.id, 
      email: user.email, 
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      employeeId,
      avatarUrl
    } 
  });
});

router.post("/refresh", async (req, res) => {
>>>>>>> dev
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
    const payload = jwt.verify(token, secret) as any;
<<<<<<< HEAD
    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({ 
      where: { id: payload.id },
      relations: {
        userRoles: {
          role: {
            permissions: {
              permission: true
            }
          }
        }
      }
    });
    if (!user) return res.status(401).json({ message: "User missing" });
    
    const roles = user.userRoles.map((ur) => ur.role.name);
    
    // Get all permissions from all roles
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
=======
    const user = await prisma.user.findUnique({ 
      where: { id: payload.id }, 
      include: { 
        userRoles: { 
          include: { 
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            } 
          } 
        },
        employee: true
      } 
    });
    if (!user) return res.status(401).json({ message: "User missing" });
    
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const employeeId = user.employee?.id;
    
    // Get all permissions from all roles
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur: any) => {
      ur.role.permissions.forEach((rp: any) => {
>>>>>>> dev
        permissionsSet.add(rp.permission.name);
      });
    });
    const permissions = Array.from(permissionsSet);
    
<<<<<<< HEAD
    // Get employee if linked
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({ where: { userId: user.id } });
    const employeeId = employee?.id;
    
    const accessToken = signAccess(user.id, roles, permissions, employeeId);
    res.json({ accessToken });
=======
    const accessToken = signAccess(user.id, roles, permissions, employeeId);
    const avatarUrl = user.avatarUrl ?? user.employee?.avatarUrl ?? null;

    res.json({ 
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
        employeeId,
        avatarUrl
      }
    });
>>>>>>> dev
  } catch {
    return res.status(401).json({ message: "Invalid refresh" });
  }
});

<<<<<<< HEAD
export default r;
=======
export default router;
>>>>>>> dev
