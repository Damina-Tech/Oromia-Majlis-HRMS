import api from "./api";

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR";

export interface InboxNotification {
  id: string;
  title: string;
  message: string;
  module: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  resourceType?: string | null;
  resourceId?: string | null;
  data?: Record<string, unknown> | null;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  module?: string;
  isRead?: boolean;
  search?: string;
}

export interface ListNotificationsResponse {
  items: InboxNotification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<ListNotificationsResponse> {
  const response = await api.get<ListNotificationsResponse>("/notifications", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      module: params.module,
      isRead:
        typeof params.isRead === "boolean" ? params.isRead.toString() : undefined,
      search: params.search,
    },
  });
  return response.data;
}

export async function markNotificationsRead(
  notificationIds: string[],
  read = true
) {
  await api.post("/notifications/mark-read", {
    notificationIds,
    read,
  });
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  channels: Record<string, boolean>;
  modules: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export async function getNotificationPreferences() {
  const response = await api.get<NotificationPreferences>("/notifications/preferences");
  return response.data;
}

export interface UpdateNotificationPreferencesPayload {
  channels?: Record<string, boolean>;
  modules?: Record<string, boolean | { inApp?: boolean; email?: boolean; push?: boolean }>;
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload
) {
  const response = await api.put<NotificationPreferences>(
    "/notifications/preferences",
    payload
  );
  return response.data;
}

export interface SendTestNotificationPayload {
  title?: string;
  message?: string;
  channel?: "IN_APP" | "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
}

export async function sendTestNotification(payload: SendTestNotificationPayload) {
  await api.post("/notifications/test", payload);
}

