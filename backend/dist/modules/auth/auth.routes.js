import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
const prisma = new PrismaClient();
const router = Router();
const LoginDto = z.object({ email: z.string().email(), password: z.string().min(6) });
function signAccess(userId, roles, permissions, employeeId) {
    const secret = process.env.JWT_ACCESS_SECRET || "your-access-secret";
    return jwt.sign({ id: userId, roles, permissions, employeeId }, secret, { expiresIn: "2h" });
}
function signRefresh(userId, roles, permissions, employeeId) {
    const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
    return jwt.sign({ id: userId, roles, permissions, employeeId }, secret, { expiresIn: "14d" });
}
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
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    // Check if user is active
    if (user.status !== "ACTIVE") {
        return res.status(403).json({ message: "Account is inactive. Please contact your administrator." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: "Invalid credentials" });
    const roles = user.userRoles.map((ur) => ur.role.name);
    const employeeId = user.employee?.id;
    // Get all permissions from all roles
    const permissionsSet = new Set();
    user.userRoles.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
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
    const token = req.cookies?.refreshToken;
    if (!token)
        return res.status(401).json({ message: "No refresh token" });
    try {
        const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
        const payload = jwt.verify(token, secret);
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
        if (!user)
            return res.status(401).json({ message: "User missing" });
        const roles = user.userRoles.map((ur) => ur.role.name);
        const employeeId = user.employee?.id;
        // Get all permissions from all roles
        const permissionsSet = new Set();
        user.userRoles.forEach((ur) => {
            ur.role.permissions.forEach((rp) => {
                permissionsSet.add(rp.permission.name);
            });
        });
        const permissions = Array.from(permissionsSet);
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
    }
    catch {
        return res.status(401).json({ message: "Invalid refresh" });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map