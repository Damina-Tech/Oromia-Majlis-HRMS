import { Router } from "express";
import { requireAuth, hasPermission, hasAnyPermission } from "../../middleware/auth.js";
import { getNotificationPreferences, getDeliveryLogs, listNotifications, markNotifications, resendNotificationDelivery, sendTestNotification, updateNotificationPreferences, } from "./notification.controller.js";
const router = Router();
router.use(requireAuth);
// Allow employees (notifications.view) and members (majlis.member) to list and manage their own notifications
const canViewNotifications = hasAnyPermission("notifications.view", "majlis.member");
router.get("/", canViewNotifications, listNotifications);
router.post("/mark-read", canViewNotifications, markNotifications);
router.get("/preferences", canViewNotifications, getNotificationPreferences);
router.put("/preferences", canViewNotifications, updateNotificationPreferences);
router.post("/test", hasPermission("notifications.manage"), sendTestNotification);
router.get("/deliveries", hasPermission("notifications.manage"), getDeliveryLogs);
router.post("/deliveries/:deliveryId/resend", hasPermission("notifications.manage"), resendNotificationDelivery);
export default router;
//# sourceMappingURL=notification.routes.js.map