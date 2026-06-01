import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to `backend/uploads`. Anchored from `src/lib` or `dist/lib` so it
 * stays correct whether the server runs via tsx or compiled `dist/server.js`.
 */
export const uploadsRoot = path.resolve(path.join(__dirname, "../../uploads"));

/**
 * Resolve a stored URL like `/uploads/document-template-sources/file.pdf` to a
 * filesystem path under {@link uploadsRoot}.
 */
export function resolveUploadPath(storedUrl: string): string {
  const trimmed = storedUrl.trim();
  if (!trimmed) {
    throw new Error("Empty upload path");
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const isWebUploadPath = normalized.startsWith("/uploads/") || normalized.toLowerCase().startsWith("uploads/");

  if (path.isAbsolute(trimmed) && !isWebUploadPath) {
    if (fs.existsSync(trimmed)) return trimmed;
  }

  let relative = normalized.replace(/^\/+/, "");
  if (relative.toLowerCase().startsWith("uploads/")) {
    relative = relative.slice("uploads/".length);
  }

  const segments = relative.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  const fullPath = path.join(uploadsRoot, ...segments);

  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  throw new Error(`Upload file not found: ${storedUrl} (looked at ${fullPath})`);
}
