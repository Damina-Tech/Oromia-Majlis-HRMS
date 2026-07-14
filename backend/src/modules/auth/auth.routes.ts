import { Router } from "express";
import prisma from "../../db/client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { z } from "zod";
import crypto from "crypto";
import { buildEffectivePermissionNames } from "../users/permission-utils.js";
import { buildAuthSessionForUser } from "./auth-session.js";
import type { UserDivisionContext } from "../org-divisions/division-access.js";
import { requireAuth } from "../../middleware/auth.js";
import rateLimit from "express-rate-limit";
import {
  LOGIN_MAX_FAILED_ATTEMPTS,
  computeLockUntil,
  getLoginLockStatus,
} from "./login-lockout.js";

const router = Router();

/** IP-based throttle so attackers cannot spray many accounts from one IP */
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts from this network. Please try again in 15 minutes.",
  },
});
const LoginDto = z.object({ email: z.string().email(), password: z.string().min(6) });
const RegisterHalalPurpose = z.enum(["halal_business_certificate", "halal_competency_certificate"]);
const RegisterHalalDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  registrationPurpose: RegisterHalalPurpose,
});

const REGISTER_ROLE_BY_PURPOSE: Record<z.infer<typeof RegisterHalalPurpose>, string> = {
  halal_business_certificate: "HALAL_BUSINESS",
  halal_competency_certificate: "HALAL_COMPETENCY",
};

const REGISTER_REDIRECT_BY_PURPOSE: Record<z.infer<typeof RegisterHalalPurpose>, string> = {
  halal_business_certificate: "/halal/dashboard",
  halal_competency_certificate: "/halal/competency",
};
const ForgotPasswordDto = z.object({ email: z.string().email() });
const ResetPasswordDto = z.object({ 
  token: z.string(), 
  password: z.string().min(6, "Password must be at least 6 characters") 
});

function refreshCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}

function getRequiredSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET", weakFallback: string): string {
  const value = process.env[name] || "";
  const weak = ["your-access-secret", "your-refresh-secret", "change_me_long_random_string", "change_me_also_long_random_string", weakFallback];
  if (process.env.NODE_ENV === "production") {
    if (!value || weak.includes(value) || value.length < 32) {
      throw new Error(`${name} must be set to a strong secret (32+ chars) in production`);
    }
    return value;
  }
  return value || weakFallback;
}

function signAccess(
  userId: string,
  roles: string[],
  permissions: string[],
  extra?: { employeeId?: string; isSuperAdmin?: boolean; divisions?: UserDivisionContext[] }
) {
  const secret = getRequiredSecret("JWT_ACCESS_SECRET", "your-access-secret");
  return jwt.sign({ id: userId, roles, permissions, ...extra }, secret, { expiresIn: "2h" });
}
function signRefresh(
  userId: string,
  roles: string[],
  permissions: string[],
  extra?: { employeeId?: string; isSuperAdmin?: boolean; divisions?: UserDivisionContext[] }
) {
  const secret = getRequiredSecret("JWT_REFRESH_SECRET", "your-refresh-secret");
  return jwt.sign({ id: userId, roles, permissions, ...extra }, secret, { expiresIn: "14d" });
}

router.post("/login", loginIpLimiter, async (req, res) => {
  try {
    const { email, password } = LoginDto.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
        employee: true,
      },
    });

    // Same generic message when user missing (avoid email enumeration)
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is inactive. Please contact your administrator." });
    }

    const lock = getLoginLockStatus(user.lockedUntil);
    if (lock.locked) {
      res.setHeader("Retry-After", String(lock.retryAfterSeconds));
      return res.status(429).json({
        message: lock.message,
        code: "ACCOUNT_LOCKED",
        lockedUntil: lock.lockedUntil.toISOString(),
        retryAfterSeconds: lock.retryAfterSeconds,
      });
    }

    // Lock expired — clear counter if still set
    if (user.lockedUntil || user.failedLoginAttempts > 0) {
      const stillLocked = getLoginLockStatus(user.lockedUntil).locked;
      if (!stillLocked && user.lockedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: null, failedLoginAttempts: 0 },
        });
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      if (attempts >= LOGIN_MAX_FAILED_ATTEMPTS) {
        const lockedUntil = computeLockUntil();
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, lockedUntil },
        });
        const status = getLoginLockStatus(lockedUntil);
        if (status.locked) {
          res.setHeader("Retry-After", String(status.retryAfterSeconds));
          return res.status(429).json({
            message: status.message,
            code: "ACCOUNT_LOCKED",
            lockedUntil: status.lockedUntil.toISOString(),
            retryAfterSeconds: status.retryAfterSeconds,
          });
        }
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, lockedUntil: null },
        });
      }
      return res.status(401).json({
        message: "Invalid credentials",
        remainingAttempts: Math.max(0, LOGIN_MAX_FAILED_ATTEMPTS - attempts),
      });
    }

    // Successful login — reset lockout state
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const session = await buildAuthSessionForUser(prisma, user.id);
    if (!session) {
      return res.status(403).json({ message: "Account is inactive. Please contact your administrator." });
    }

    const { roles, permissions, employeeId, isSuperAdmin, divisions, avatarUrl } = session;
    const tokenExtra = { employeeId, isSuperAdmin, divisions };
    const accessToken = signAccess(user.id, roles, permissions, tokenExtra);
    const refreshToken = signRefresh(user.id, roles, permissions, tokenExtra);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

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
        avatarUrl,
        isSuperAdmin,
        divisions,
      },
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ message: "Invalid login payload", issues: e.issues });
    }
    console.error("Login error:", e);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// POST /api/v1/auth/register - Public self-registration (Halal business certification or Halal competency applicant)
router.post("/register", async (req, res) => {
  try {
    const dto = RegisterHalalDto.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please log in instead." });
    }

    const roleName = REGISTER_ROLE_BY_PURPOSE[dto.registrationPurpose];
    const halalRole = await prisma.role.findUnique({ where: { name: roleName } });
    if (!halalRole) {
      return res.status(500).json({
        message: "Halal registration is not configured for this account type. Please contact support.",
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: "ACTIVE",
        userRoles: {
          create: [{ roleId: halalRole.id }],
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
        employee: true,
      },
    });

    const roles = newUser.userRoles.map((ur: any) => ur.role.name);
    const permissions = buildEffectivePermissionNames(
      newUser.userRoles as any,
      newUser.userPermissions as any
    );

    const accessToken = signAccess(newUser.id, roles, permissions, undefined);
    const refreshToken = signRefresh(newUser.id, roles, permissions, undefined);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    res.status(201).json({
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roles,
        permissions,
        employeeId: null,
        avatarUrl: null,
      },
      redirectTo: REGISTER_REDIRECT_BY_PURPOSE[dto.registrationPurpose],
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      const first = error.issues?.[0] ?? error.errors?.[0];
      return res.status(400).json({
        message: first?.message ?? "Invalid input",
        errors: error.issues ?? error.errors,
      });
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
    const payload = jwt.verify(token, secret) as any;
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
        userPermissions: {
          include: {
            permission: true,
          },
        },
        employee: true
      } 
    });
    if (!user) return res.status(401).json({ message: "User missing" });

    const session = await buildAuthSessionForUser(prisma, user.id);
    if (!session) return res.status(401).json({ message: "User inactive" });

    const { roles, permissions, employeeId, isSuperAdmin, divisions, avatarUrl } = session;
    const tokenExtra = { employeeId, isSuperAdmin, divisions };
    const accessToken = signAccess(user.id, roles, permissions, tokenExtra);

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
        avatarUrl,
        isSuperAdmin,
        divisions,
      },
    });
  } catch {
    return res.status(401).json({ message: "Invalid refresh" });
  }
});

/**
 * GET /api/v1/auth/me
 * Rebuild current user session from DB (including employeeId) using access token.
 * Use this when local session is missing employeeId without forcing logout/login.
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ message: "User missing" });

    const session = await buildAuthSessionForUser(prisma, userId);
    if (!session) return res.status(401).json({ message: "User inactive" });

    const { roles, permissions, employeeId, isSuperAdmin, divisions, avatarUrl } = session;
    const tokenExtra = { employeeId, isSuperAdmin, divisions };
    const accessToken = signAccess(user.id, roles, permissions, tokenExtra);

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
        employeeId: employeeId ?? null,
        avatarUrl,
        isSuperAdmin,
        divisions,
      },
    });
  } catch (error) {
    console.error("auth/me failed:", error);
    return res.status(500).json({ message: "Failed to load session" });
  }
});

// POST /api/v1/auth/forgot-password - Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = ForgotPasswordDto.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Don't reveal if user exists or not for security
    // Also check if user is active - only active users can reset password
    if (!user || user.status !== "ACTIVE") {
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetTokenExpiry
      }
    });

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    
    // TODO: Send email with reset link using your email service
    // await sendPasswordResetEmail(user.email, resetLink);
    
    // In development, log the reset link for testing
    if (process.env.NODE_ENV === "development") {
      console.log(`Password reset link for ${email}: ${resetLink}`);
    }

    res.json({ 
      message: "If an account with that email exists, a password reset link has been sent.",
      // Only show in development
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid email address" });
    }
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// POST /api/v1/auth/reset-password - Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = ResetPasswordDto.parse(req.body);
    
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Check if user is active - only active users can reset password
    if (resetToken.user.status !== "ACTIVE") {
      return res.status(403).json({ 
        message: "Password reset is not available for inactive accounts. Please contact your administrator." 
      });
    }

    // Check if token has been used
    if (resetToken.used) {
      return res.status(400).json({ message: "This reset token has already been used" });
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    res.json({ message: "Password has been reset successfully. You can now login with your new password." });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// POST /api/v1/auth/google - Google OAuth login
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    // TODO: Verify Google ID token
    // In production, verify the token with Google's API
    // const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();
    
    // For now, return an error indicating OAuth needs to be configured
    res.status(501).json({ 
      message: "Google OAuth needs to be configured. Please use email/password login." 
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// POST /api/v1/auth/facebook - Facebook OAuth login
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ message: "Facebook access token is required" });
    }

    // TODO: Verify Facebook access token with Facebook's Graph API
    // For production, implement:
    // const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    // const userData = await response.json();
    // if (userData.error) throw new Error('Invalid token');
    // const email = userData.email;
    
    // Then:
    // 1. Find or create user by email
    // 2. Generate JWT tokens
    // 3. Return tokens and user data
    
    res.status(501).json({ 
      message: "Facebook OAuth is not yet fully configured. Please use email/password login for now.",
    });
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    res.status(500).json({ message: "Facebook authentication failed" });
  }
});

export default router;
