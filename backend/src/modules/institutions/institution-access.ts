import type { Request } from "express";
import type { JwtUser } from "../../middleware/auth.js";
import prisma from "../../db/client.js";

export function getRequestUser(req: Request): JwtUser | undefined {
  return (req as any).user as JwtUser | undefined;
}

/** Staff with full institution admin access (not portal-only owners). */
export function isInstitutionStaff(user: JwtUser | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const perms = user.permissions ?? [];
  return (
    perms.includes("majlis.institutions.write") ||
    perms.includes("majlis.institutions.approve") ||
    perms.includes("majlis.institutions.delete") ||
    (perms.includes("majlis.institutions.read") && !perms.includes("majlis.institution.owner"))
  );
}

export function isInstitutionOwnerOnly(user: JwtUser | undefined): boolean {
  if (!user) return false;
  if (isInstitutionStaff(user)) return false;
  return (user.permissions ?? []).includes("majlis.institution.owner");
}

export async function userOwnsInstitution(userId: string, institutionId: string): Promise<boolean> {
  const row = await prisma.institution.findFirst({
    where: { id: institutionId, ownerUserId: userId },
    select: { id: true },
  });
  return !!row;
}

export async function assertCanAccessInstitution(
  req: Request,
  institutionId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const user = getRequestUser(req);
  if (!user?.id) return { ok: false, status: 401, message: "Unauthenticated" };
  if (isInstitutionStaff(user)) return { ok: true };
  if (!isInstitutionOwnerOnly(user)) {
    // Any authenticated user with read permission (e.g. representative)
    if ((user.permissions ?? []).includes("majlis.institutions.read")) return { ok: true };
    return { ok: false, status: 403, message: "Forbidden" };
  }
  const owns = await userOwnsInstitution(user.id, institutionId);
  if (!owns) return { ok: false, status: 403, message: "You can only access institutions you registered" };
  return { ok: true };
}

export async function assertCanManageInstitution(
  req: Request,
  institutionId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const user = getRequestUser(req);
  if (!user?.id) return { ok: false, status: 401, message: "Unauthenticated" };
  if ((user.permissions ?? []).includes("majlis.institutions.write") || user.isSuperAdmin) {
    return { ok: true };
  }
  if (!isInstitutionOwnerOnly(user)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  const owns = await userOwnsInstitution(user.id, institutionId);
  if (!owns) return { ok: false, status: 403, message: "You can only manage institutions you registered" };
  return { ok: true };
}
