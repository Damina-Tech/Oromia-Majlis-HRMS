import { StateCreator } from "zustand";
import type { InboxNotification } from "@/services/notifications";

export interface Notification extends InboxNotification {
  // Extend if we ever need client-only fields
}

export interface NotificationSlice {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  upsertNotification: (notification: Notification) => void;
  markLocalRead: (ids: string[], read: boolean) => void;
  clearNotifications: () => void;
}

export const notificationSlice: StateCreator<NotificationSlice> = (set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
    });
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  upsertNotification: (notification) => {
    set((state) => {
      const existingIndex = state.notifications.findIndex((n) => n.id === notification.id);
      let notifications: Notification[];

      if (existingIndex >= 0) {
        notifications = [...state.notifications];
        notifications[existingIndex] = {
          ...notifications[existingIndex],
          ...notification,
        };
      } else {
        notifications = [notification, ...state.notifications];
      }

      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    });
  },

  markLocalRead: (ids, read) => {
    set((state) => {
      const notifications = state.notifications.map((notification) =>
        ids.includes(notification.id) ? { ...notification, isRead: read } : notification
      );

      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    });
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
});