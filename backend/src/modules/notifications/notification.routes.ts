import { Router } from "express";
import { requireAuth, hasPermission } from "../../middleware/auth.js";
import {
  getNotificationPreferences,
  getDeliveryLogs,
  listNotifications,
  markNotifications,
  resendNotificationDelivery,
  sendTestNotification,
  updateNotificationPreferences,
} from "./notification.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", hasPermission("notifications.view"), listNotifications);
router.post("/mark-read", hasPermission("notifications.view"), markNotifications);
router.get("/preferences", hasPermission("notifications.view"), getNotificationPreferences);
router.put("/preferences", hasPermission("notifications.view"), updateNotificationPreferences);
router.post("/test", hasPermission("notifications.manage"), sendTestNotification);

router.get(
  "/deliveries",
  hasPermission("notifications.manage"),
  getDeliveryLogs
);

router.post(
  "/deliveries/:deliveryId/resend",
  hasPermission("notifications.manage"),
  resendNotificationDelivery
);

export default router;

