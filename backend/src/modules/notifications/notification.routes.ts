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

router.get("/", listNotifications);
router.post("/mark-read", markNotifications);
router.get("/preferences", getNotificationPreferences);
router.put("/preferences", updateNotificationPreferences);
router.post("/test", sendTestNotification);

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

