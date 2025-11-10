import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getRole,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  getCurrentUser,
  updateCurrentUser,
  uploadUserAvatar,
} from "./user.controller.js";
import { requireAuth, hasAnyPermission, hasPermission } from "../../middleware/auth.js";
import { uploadAvatar } from "../../lib/upload.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get("/me", getCurrentUser);
router.put("/me", updateCurrentUser);
router.post("/me/avatar", uploadAvatar.single("avatar"), uploadUserAvatar);

// Get permissions (for dropdowns)
router.get("/permissions", getPermissions);

// Role CRUD operations - specific routes must come before general routes
router.get("/roles/:id", hasAnyPermission("users.read", "users.write"), getRole);
router.post("/roles", hasPermission("users.write"), createRole);
router.put("/roles/:id", hasPermission("users.write"), updateRole);
router.delete("/roles/:id", hasPermission("users.delete"), deleteRole);
router.get("/roles", getRoles);

// User CRUD operations
router.get("/", hasAnyPermission("users.read", "users.write"), listUsers);
router.get("/:id", hasAnyPermission("users.read", "users.write"), getUser);
router.post("/", hasPermission("users.write"), createUser);
router.put("/:id", hasPermission("users.write"), updateUser);
router.delete("/:id", hasPermission("users.delete"), deleteUser);

export default router;
