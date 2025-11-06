import { Router } from "express";
import {
  createAnnouncement,
  listAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  acknowledgeAnnouncement,
  listAnnouncementReads,
  getAnnouncementStats,
} from "./announcement.controller.js";
import { hasPermission } from "../../middleware/auth.js";

const router = Router();

// Announcement routes
router.post("/", hasPermission("announcements.create"), createAnnouncement);
router.get("/", listAnnouncements);
router.get("/:id", getAnnouncement);
router.put("/:id", hasPermission("announcements.edit"), updateAnnouncement);
router.delete("/:id", hasPermission("announcements.delete"), deleteAnnouncement);

// Publish
router.post("/:id/publish", hasPermission("announcements.publish"), publishAnnouncement);

// Acknowledge/Read
router.post("/:id/ack", acknowledgeAnnouncement);

// Admin routes
router.get("/:id/reads", hasPermission("announcements.view"), listAnnouncementReads);
router.get("/:id/stats", hasPermission("announcements.view"), getAnnouncementStats);

export default router;

