/** Account lockout after consecutive failed password attempts */

export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

export type LoginLockStatus =
  | { locked: false }
  | { locked: true; lockedUntil: Date; retryAfterSeconds: number; message: string };

export function getLoginLockStatus(lockedUntil: Date | null | undefined, now = new Date()): LoginLockStatus {
  if (!lockedUntil) return { locked: false };
  const until = lockedUntil instanceof Date ? lockedUntil : new Date(lockedUntil);
  if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime()) {
    return { locked: false };
  }
  const retryAfterSeconds = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
  const minutesLeft = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return {
    locked: true,
    lockedUntil: until,
    retryAfterSeconds,
    message: `Too many failed login attempts. Your account is temporarily locked. Try again in about ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
  };
}

export function computeLockUntil(now = new Date()): Date {
  return new Date(now.getTime() + LOGIN_LOCKOUT_MINUTES * 60 * 1000);
}
