import { Router } from "express";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  addTimeLog,
  bulkUpdateTasks,
  getTaskStats,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from "./task.controller.js";
import { hasPermission } from "../../middleware/auth.js";
import { uploadTaskAttachment } from "../../lib/upload.js";

const router = Router();

// Task routes
router.post("/", hasPermission("tasks.create"), createTask);
router.get("/", listTasks);
router.get("/stats", hasPermission("tasks.view"), getTaskStats);
router.get("/:id", getTask);
router.put("/:id", hasPermission("tasks.edit"), updateTask);
router.delete("/:id", hasPermission("tasks.delete"), deleteTask);

// Task comments
router.post("/:id/comments", addComment);

// Task time logs
router.post("/:id/time-logs", hasPermission("tasks.edit"), addTimeLog);

// Task attachments
router.post(
  "/:id/attachments",
  hasPermission("tasks.edit"),
  uploadTaskAttachment.single("file"),
  uploadAttachment
);
router.get("/:id/attachments/:attachmentId/download", downloadAttachment);
router.delete("/:id/attachments/:attachmentId", hasPermission("tasks.edit"), deleteAttachment);

// Bulk operations
router.post("/bulk-update", hasPermission("tasks.edit"), bulkUpdateTasks);

export default router;

