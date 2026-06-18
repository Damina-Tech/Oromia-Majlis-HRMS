import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { isSuperAdminUser, userCanUsePermissionInScope, type UserDivisionContext } from "../modules/org-divisions/division-access.js";

export type { UserDivisionContext };

export interface JwtUser { 
  id: string; 
  roles: string[]; 
  permissions: string[];
  employeeId?: string;
  isSuperAdmin?: boolean;
  divisions?: UserDivisionContext[];
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });
  const token = header.split(" ")[1];
  try {
    const secret = process.env.JWT_ACCESS_SECRET || "your-access-secret";
    const payload = jwt.verify(token, secret) as JwtUser;
    (req as any).user = payload;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function hasRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtUser | undefined;
    if (!u) return res.status(401).json({ message: "Unauthenticated" });
    if (!u.roles.some(r => roles.includes(r))) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

/**
 * Check if user has specific permission(s)
 * User must have ALL specified permissions
 */
export function hasPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtUser | undefined;
    if (!u) return res.status(401).json({ message: "Unauthenticated" });
    
    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(
      (p) => u.permissions.includes(p) && userCanUsePermissionInScope(u, p)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        required: permissions,
        current: u.permissions
      });
    }
    
    next();
  };
}

/**
 * Check if user has ANY of the specified permissions
 * User needs at least ONE of the specified permissions
 */
export function hasSuperAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtUser | undefined;
    if (!u) return res.status(401).json({ message: "Unauthenticated" });
    if (!isSuperAdminUser(u)) {
      return res.status(403).json({ message: "Forbidden: super admin access required" });
    }
    next();
  };
}

/**
 * Check if user has ANY of the specified permissions (division-scoped when assignments exist).
 */
export function hasAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtUser | undefined;
    if (!u) return res.status(401).json({ message: "Unauthenticated" });

    const hasAnyPerm = permissions.some(
      (p) => u.permissions.includes(p) && userCanUsePermissionInScope(u, p)
    );

    if (!hasAnyPerm) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: permissions,
        current: u.permissions,
      });
    }

    next();
  };
}
