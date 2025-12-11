<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useCallback, useEffect, useMemo, useState } from "react";
>>>>>>> dev
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
<<<<<<< HEAD
import { useNotifications } from "@/store";
import {
  Bell,
  BellOff,
  Plus,
  Mail,
  Smartphone,
  Slack,
=======
import { useStore } from "@/store";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  BellOff,
  Mail,
  Smartphone,
>>>>>>> dev
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Send,
  Filter,
<<<<<<< HEAD
} from "lucide-react";
import { format } from "date-fns";
type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationsPage() {
  // Local notification list state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Filter state
  const [filter, setFilter] = useState<
    "all" | "unread" | "read" | NotificationType
  >("all");

  // Dialog states
  const [sendDialog, setSendDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType,
    recipients: "all",
    channels: {
      inApp: true,
      email: false,
      push: false,
    },
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      frequency: "immediate",
      types: {
        leaveRequests: true,
        timesheetReminders: true,
        systemUpdates: false,
        announcements: true,
      },
    },
    push: {
      enabled: true,
      types: {
        leaveRequests: true,
        timesheetReminders: false,
        systemUpdates: false,
        announcements: false,
      },
    },
    slack: {
      enabled: false,
      webhook: "",
      types: {
        leaveRequests: false,
        timesheetReminders: false,
        systemUpdates: false,
        announcements: false,
      },
    },
  });

  // Add notification helper
  const addNotification = (
    notif: Omit<Notification, "id" | "isRead" | "createdAt">
  ) => {
    setNotifications((prev) => [
      ...prev,
      {
        ...notif,
        id: Date.now().toString(),
        isRead: false,
        createdAt: new Date(),
      },
    ]);
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Mark all read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    if (filter !== "all" && filter !== notification.type) return false;
    return true;
  });

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Stats for display
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    today: notifications.filter(
      (n) =>
        format(n.createdAt, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    ).length,
    thisWeek: notifications.filter((n) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return n.createdAt >= weekAgo;
    }).length,
  };

  // Icons for notification types
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "border-l-green-500";
      case "warning":
        return "border-l-yellow-500";
      case "error":
        return "border-l-red-500";
      default:
        return "border-l-blue-500";
    }
  };

  // Handle sending notification
  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) {
      addNotification({
        title: "Missing Information",
        message: "Please provide title and message",
        type: "error",
      });
      return;
    }

    addNotification({
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type,
    });

    // Simulate sending via other channels
    if (notificationForm.channels.email) {
      console.log("Sending email notification...");
    }
    if (notificationForm.channels.push) {
      console.log("Sending push notification...");
    }

    addNotification({
      title: "Notification Sent",
      message: `Notification sent to ${notificationForm.recipients} recipients`,
      type: "success",
    });

    setSendDialog(false);
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      recipients: "all",
      channels: {
        inApp: true,
        email: false,
        push: false,
      },
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    addNotification({
      title: "All Marked as Read",
      message: "All notifications have been marked as read",
      type: "success",
    });
  };

  const handleClearAll = () => {
    clearNotifications();
    addNotification({
      title: "Notifications Cleared",
      message: "All notifications have been cleared",
      type: "success",
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };
=======
  BarChart3,
  Megaphone,
  FileText,
  Users,
  Briefcase,
  ClipboardList,
  CreditCard,
  Building,
  ClipboardCheck,
  CalendarClock,
} from "lucide-react";
import { format, isSameWeek, isToday } from "date-fns";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  listNotifications,
  markNotificationsRead,
  sendTestNotification,
  updateNotificationPreferences,
  type InboxNotification,
  type NotificationPreferences,
} from "@/services/notifications";

type StatusFilter = "all" | "unread" | "read";
type TypeFilter = "all" | "INFO" | "SUCCESS" | "WARNING" | "ERROR";

const MODULE_OPTIONS = [
  { value: "SYSTEM", label: "System", icon: Info },
  { value: "EMPLOYEE", label: "Employees", icon: Users },
  { value: "DEPARTMENT", label: "Departments", icon: Building },
  { value: "LEAVE", label: "Leave", icon: CalendarClock },
  { value: "ATTENDANCE", label: "Attendance", icon: ClipboardList },
  { value: "PAYROLL", label: "Payroll", icon: BarChart3 },
  { value: "TASK", label: "Tasks", icon: ClipboardCheck },
  { value: "ASSET", label: "Assets", icon: Briefcase },
  { value: "EXPENSE", label: "Expenses", icon: CreditCard },
  { value: "DOCUMENT", label: "Documents", icon: FileText },
  { value: "ANNOUNCEMENT", label: "Announcements", icon: Megaphone },
];

const TYPE_ICON: Record<TypeFilter, React.ReactNode> = {
  all: <Info className="h-4 w-4 text-blue-500" />,
  INFO: <Info className="h-4 w-4 text-blue-500" />,
  SUCCESS: <CheckCircle className="h-4 w-4 text-green-500" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
};

const TYPE_COLOR: Record<TypeFilter, string> = {
  all: "border-l-blue-500",
  INFO: "border-l-blue-500",
  SUCCESS: "border-l-green-500",
  WARNING: "border-l-yellow-500",
  ERROR: "border-l-red-500",
};

const DEFAULT_CHANNEL_PREFS = {
  inApp: true,
  email: false,
  push: false,
  sms: false,
  whatsapp: false,
};

const MODULE_LABEL_MAP = MODULE_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {}
);

export default function NotificationsPage() {
  const [inbox, setInbox] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [channelPrefs, setChannelPrefs] = useState(DEFAULT_CHANNEL_PREFS);
  const [modulePrefs, setModulePrefs] = useState<Record<string, boolean>>({});
  const [testNotification, setTestNotification] = useState({
    title: "",
    message: "",
    channel: "IN_APP" as "IN_APP" | "EMAIL" | "PUSH" | "SMS" | "WHATSAPP",
  });

  const setUnreadCount = useStore((state) => state.setUnreadCount);
  const markLocalRead = useStore((state) => state.markLocalRead);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setInbox([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [response, unreadResponse] = await Promise.all([
        listNotifications({
          page,
          pageSize,
          module: moduleFilter !== "all" ? moduleFilter : undefined,
          search: search || undefined,
        }),
        listNotifications({
          page: 1,
          pageSize: 1,
        isRead: false,
        }),
      ]);

      const filteredItems = response.items.filter((item) => {
        if (statusFilter === "unread") return !item.isRead;
        if (statusFilter === "read") return item.isRead;
        return true;
      });

      setInbox(filteredItems);
      setTotal(
        statusFilter === "all"
          ? response.total
          : filteredItems.length
      );
      setUnreadCount(unreadResponse.total);
    } catch (error: any) {
      console.error("Failed to load notifications", error);
      toast.error(error?.response?.data?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter, statusFilter, search, setUnreadCount, isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated]);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      setChannelPrefs(DEFAULT_CHANNEL_PREFS);
      setModulePrefs({});
      return;
    }
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
      const channels = {
        ...DEFAULT_CHANNEL_PREFS,
        ...(prefs.channels as Record<string, boolean>),
      };
      setChannelPrefs(channels);

      const modules = MODULE_OPTIONS.reduce<Record<string, boolean>>((acc, option) => {
        const key = option.value;
        const value = prefs.modules?.[key];
        if (typeof value === "boolean") {
          acc[key] = value;
        } else if (typeof value === "object") {
          acc[key] = Boolean((value as any)?.inApp ?? true);
        } else {
          acc[key] = true;
        }
        return acc;
      }, {});

      setModulePrefs(modules);
    } catch (error: any) {
      console.error("Failed to load notification preferences", error);
      toast.error(error?.response?.data?.message ?? "Failed to load preferences");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const filteredNotifications = useMemo(() => {
    return inbox.filter((notification) => {
      if (typeFilter !== "all" && notification.type !== typeFilter) {
        return false;
      }
    return true;
  });
  }, [inbox, typeFilter]);

  const stats = useMemo(() => {
    const totalNotifications = filteredNotifications.length;
    const unread = filteredNotifications.filter((n) => !n.isRead).length;
    const today = filteredNotifications.filter((n) =>
      isToday(new Date(n.createdAt))
    ).length;
    const thisWeek = filteredNotifications.filter((n) =>
      isSameWeek(new Date(n.createdAt), new Date(), { weekStartsOn: 1 })
    ).length;

    return {
      total: totalNotifications,
      unread,
      today,
      thisWeek,
    };
  }, [filteredNotifications]);

  const handleMarkAsRead = async (id: string, read: boolean) => {
    try {
      await markNotificationsRead([id], read);
      markLocalRead([id], read);
      fetchNotifications();
      toast.success(read ? "Notification marked as read" : "Notification marked as unread");
    } catch (error: any) {
      console.error("Failed to update notification", error);
      toast.error(error?.response?.data?.message ?? "Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = inbox.filter((notification) => !notification.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markNotificationsRead(unreadIds, true);
      markLocalRead(unreadIds, true);
      fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Failed to mark notifications", error);
      toast.error(error?.response?.data?.message ?? "Failed to mark notifications");
    }
  };

  const handleChannelToggle = async (channel: keyof typeof channelPrefs, value: boolean) => {
    setChannelPrefs((prev) => ({ ...prev, [channel]: value }));
    try {
      await updateNotificationPreferences({
        channels: {
          ...channelPrefs,
          [channel]: value,
        },
      });
      toast.success("Channel preferences updated");
      loadPreferences();
    } catch (error: any) {
      console.error("Failed to update preferences", error);
      toast.error(error?.response?.data?.message ?? "Failed to update preferences");
    }
  };

  const handleModuleToggle = async (module: string, value: boolean) => {
    setModulePrefs((prev) => ({ ...prev, [module]: value }));
    try {
      await updateNotificationPreferences({
        modules: {
          [module]: value,
        },
      });
      toast.success("Module preferences updated");
      loadPreferences();
    } catch (error: any) {
      console.error("Failed to update module preferences", error);
      toast.error(error?.response?.data?.message ?? "Failed to update preferences");
    }
  };

  const handleSendTestNotification = async () => {
    if (!testNotification.title.trim() || !testNotification.message.trim()) {
      toast.error("Please provide title and message");
      return;
    }

    try {
      await sendTestNotification(testNotification);
      toast.success("Test notification sent");
      setSendDialogOpen(false);
      fetchNotifications();
    } catch (error: any) {
      console.error("Failed to send test notification", error);
      toast.error(error?.response?.data?.message ?? "Failed to send test notification");
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchNotifications();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
>>>>>>> dev

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
<<<<<<< HEAD
            Manage and configure your notification preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={sendDialog} onOpenChange={setSendDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
=======
            Review your inbox, configure preferences, and send test notifications.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Test
>>>>>>> dev
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

<<<<<<< HEAD
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
=======
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
>>>>>>> dev
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
<<<<<<< HEAD
=======
            <p className="text-xs text-muted-foreground mt-1">
              {total} total records (showing {inbox.length})
            </p>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-2xl font-bold text-red-600">
              {stats.unread}
            </div>
=======
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread in current view</p>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
<<<<<<< HEAD
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
=======
            <CalendarClock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered today</p>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
<<<<<<< HEAD
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.thisWeek}
            </div>
=======
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered in the last 7 days</p>
>>>>>>> dev
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
      {/* Notification List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Inbox</CardTitle>
              <CardDescription>
                Your recent notifications and alerts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={filter}
                // onValueChange={setFilter}
              >
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
=======
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Notification Inbox</CardTitle>
              <CardDescription>Review recent activity across modules.</CardDescription>
            </div>
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
            <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => { setStatusFilter(value); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
>>>>>>> dev
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
<<<<<<< HEAD
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
=======
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
                  <SelectTrigger className="w-[140px]">
                    {TYPE_ICON[typeFilter]}
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
                <Select
                  value={moduleFilter}
                  onValueChange={(value) => {
                    setModuleFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {MODULE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="lg:w-64"
                />
                <Button variant="outline" onClick={handleSearch}>
                  Search
                </Button>
              </div>
>>>>>>> dev
            </div>
          </div>
        </CardHeader>
        <CardContent>
<<<<<<< HEAD
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4" />
                <p>No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 bg-card rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer ${getNotificationColor(
                    notification.type
                  )} ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-950/10" : ""
                  }`}
                  onClick={() =>
                    !notification.isRead && handleMarkAsRead(notification.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
=======
          <div className="flex justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredNotifications.length} of {total} notifications.
            </div>
            <div className="flex gap-2">
              {inbox.some((notification) => !notification.isRead) && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("unread");
                  setPage(1);
                }}
              >
                Unread only
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4" />
                No notifications found
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const groupedCount =
                  typeof notification.data?.count === "number"
                    ? notification.data.count
                    : undefined;
                const createdAt = new Date(notification.createdAt);
                const badgeLabel =
                  moduleFilter === "all"
                    ? MODULE_LABEL_MAP[notification.module] ?? notification.module
                    : MODULE_LABEL_MAP[moduleFilter] ?? moduleFilter;

                return (
                <div
                  key={notification.id}
                    className={`border rounded-lg border-border/60 bg-card p-4 transition-all hover:shadow-sm ${
                      TYPE_COLOR[(notification.type as TypeFilter) ?? "all"]
                    } ${
                      !notification.isRead ? "bg-blue-50/60 dark:bg-blue-950/10" : ""
                  }`}
                >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {TYPE_ICON[(notification.type as TypeFilter) ?? "all"]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold leading-tight">
                              {notification.title}
                            </h3>
                            {badgeLabel && (
                              <Badge variant="outline" className="text-xs">
                                {badgeLabel}
                              </Badge>
                            )}
>>>>>>> dev
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
<<<<<<< HEAD
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {format(
                              notification.createdAt,
                              "MMM dd, yyyy HH:mm"
                            )}
                          </span>
                          {/* {notification.actionUrl && (
                            <span className="text-blue-600 hover:underline">
                              View Details →
                            </span>
                          )} */}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      // onClick={(e) => {
                      //   e.stopPropagation();
                      //   removeNotification(notification.id);
                      // }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to users via multiple channels
=======
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(createdAt, "MMM dd, yyyy HH:mm")}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleMarkAsRead(notification.id, !notification.isRead)
                              }
                            >
                              {notification.isRead ? "Mark unread" : "Mark read"}
                            </Button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        {groupedCount !== undefined && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {groupedCount} similar notifications grouped.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-6">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Notification</DialogTitle>
            <DialogDescription>
              Dispatch a sample notification through your preferred channel.
>>>>>>> dev
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
<<<<<<< HEAD
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    title: e.target.value,
=======
              <Label htmlFor="test-title">Title</Label>
              <Input
                id="test-title"
                value={testNotification.title}
                onChange={(event) =>
                  setTestNotification((prev) => ({
                    ...prev,
                    title: event.target.value,
>>>>>>> dev
                  }))
                }
                placeholder="Notification title"
              />
            </div>
            <div>
<<<<<<< HEAD
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    message: e.target.value,
=======
              <Label htmlFor="test-message">Message</Label>
              <Textarea
                id="test-message"
                value={testNotification.message}
                onChange={(event) =>
                  setTestNotification((prev) => ({
                    ...prev,
                    message: event.target.value,
>>>>>>> dev
                  }))
                }
                placeholder="Notification message"
                rows={3}
              />
            </div>
<<<<<<< HEAD
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={notificationForm.type}
                  // onValueChange={(value) =>
                  //   setNotificationForm((prev) => ({ ...prev, type: value }))
                  // }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recipients">Recipients</Label>
                <Select
                  value={notificationForm.recipients}
                  onValueChange={(value) =>
                    setNotificationForm((prev) => ({
                      ...prev,
                      recipients: value,
=======
              <div>
              <Label htmlFor="test-channel">Channel</Label>
                <Select
                value={testNotification.channel}
                  onValueChange={(value) =>
                  setTestNotification((prev) => ({
                      ...prev,
                    channel: value as typeof testNotification.channel,
>>>>>>> dev
                    }))
                  }
                >
                  <SelectTrigger>
<<<<<<< HEAD
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="managers">Managers Only</SelectItem>
                    <SelectItem value="hr">HR Team</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Delivery Channels</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm">In-App Notification</span>
                  </div>
                  <Switch
                    checked={notificationForm.channels.inApp}
                    onCheckedChange={(checked) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Switch
                    checked={notificationForm.channels.email}
                    onCheckedChange={(checked) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Push Notification</span>
                  </div>
                  <Switch
                    checked={notificationForm.channels.push}
                    onCheckedChange={(checked) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, push: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendNotification}>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
=======
                  <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendTestNotification}>
                <Send className="mr-2 h-4 w-4" />
                Send
>>>>>>> dev
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

<<<<<<< HEAD
      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure your notification preferences and delivery methods
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Email Settings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <h3 className="font-medium">Email Notifications</h3>
                </div>
                <Switch
                  checked={notificationSettings.email.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      email: { ...prev.email, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.email.enabled && (
                <div className="space-y-3 pl-7">
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={notificationSettings.email.frequency}
                      onValueChange={(value) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          email: { ...prev.email, frequency: value },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notification Types</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(notificationSettings.email.types).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <Switch
                              checked={value}
                              onCheckedChange={(checked) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  email: {
                                    ...prev.email,
                                    types: {
                                      ...prev.email.types,
                                      [key]: checked,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <h3 className="font-medium">Push Notifications</h3>
                </div>
                <Switch
                  checked={notificationSettings.push.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      push: { ...prev.push, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.push.enabled && (
                <div className="space-y-2 pl-7">
                  {Object.entries(notificationSettings.push.types).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              push: {
                                ...prev.push,
                                types: { ...prev.push.types, [key]: checked },
                              },
                            }))
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Slack Integration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Slack className="h-5 w-5" />
                  <h3 className="font-medium">Slack Integration</h3>
                </div>
                <Switch
                  checked={notificationSettings.slack.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      slack: { ...prev.slack, enabled: checked },
                    }))
                  }
                />
              </div>
              {notificationSettings.slack.enabled && (
                <div className="space-y-3 pl-7">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={notificationSettings.slack.webhook}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          slack: { ...prev.slack, webhook: e.target.value },
                        }))
                      }
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                  <div>
                    <Label>Notification Types</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(notificationSettings.slack.types).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <Switch
                              checked={value}
                              onCheckedChange={(checked) =>
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  slack: {
                                    ...prev.slack,
                                    types: {
                                      ...prev.slack.types,
                                      [key]: checked,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  addNotification({
                    title: "Settings Saved",
                    message: "Your notification preferences have been updated",
                    type: "success",
                  });
                  setSettingsDialog(false);
                }}
              >
                Save Settings
=======
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Choose how you receive notifications and which modules you follow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Channels</h3>
              <p className="text-xs text-muted-foreground">
                Enable or disable delivery channels. In-app notifications cannot be disabled.
              </p>
              <div className="grid gap-3">
                {Object.entries(channelPrefs).map(([channel, enabled]) => (
                  <div
                    key={channel}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                <div className="flex items-center gap-2">
                      {channel === "inApp" && <Bell className="h-4 w-4" />}
                      {channel === "email" && <Mail className="h-4 w-4" />}
                      {channel === "push" && <Smartphone className="h-4 w-4" />}
                      {channel === "sms" && <Smartphone className="h-4 w-4" />}
                      {channel === "whatsapp" && <Smartphone className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">
                        {channel === "sms"
                          ? "SMS"
                          : channel === "inApp"
                          ? "In-App"
                          : channel}
                      </span>
                </div>
                <Switch
                      disabled={channel === "inApp"}
                      checked={enabled}
                      onCheckedChange={(value) =>
                        handleChannelToggle(channel as keyof typeof channelPrefs, value)
                              }
                            />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Module Subscriptions</h3>
              <p className="text-xs text-muted-foreground">
                Control which modules send you in-app notifications.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {MODULE_OPTIONS.map((module) => (
                  <div
                    key={module.value}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                <div className="flex items-center gap-2">
                      <module.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{module.label}</span>
                </div>
                <Switch
                      checked={modulePrefs[module.value] ?? true}
                      onCheckedChange={(value) => handleModuleToggle(module.value, value)}
                    />
                  </div>
                ))}
                          </div>
            </section>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Close
>>>>>>> dev
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
