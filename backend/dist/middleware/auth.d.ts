import { Request, Response, NextFunction } from "express";
export interface JwtUser {
    id: string;
    roles: string[];
    permissions: string[];
    employeeId?: string;
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function hasRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Check if user has specific permission(s)
 * User must have ALL specified permissions
 */
export declare function hasPermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Check if user has ANY of the specified permissions
 * User needs at least ONE of the specified permissions
 */
export declare function hasAnyPermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map