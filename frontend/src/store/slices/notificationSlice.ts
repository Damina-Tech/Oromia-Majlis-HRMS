import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  data?: any;
}

export interface NotificationSlice {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

export const notificationSlice: StateCreator<NotificationSlice> = (set, get) => ({
  notifications: [
  {
    id: '1',
    title: 'Welcome to HR Management',
    message: 'Your account has been set up successfully. Please complete your profile.',
    type: 'info',
    isRead: false,
    createdAt: new Date(),
    actionUrl: '/profile'
  },
  {
    id: '2',
    title: 'Leave Request Approved',
    message: 'Your leave request for December 25-26 has been approved.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Timesheet Reminder',
    message: 'Please submit your timesheet for this week.',
    type: 'warning',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }],

  unreadCount: 2,

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date()
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));

    // Auto-remove notification after 10 seconds for success/info types
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, 10000);
    }
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notifications = state.notifications.map((notification) =>
      notification.id === id ?
      { ...notification, isRead: true } :
      notification
      );

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return { notifications, unreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true
      })),
      unreadCount: 0
    }));
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0
    });
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      return { notifications, unreadCount };
    });
  }
});