import React, { useState } from "react";
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
import { useNotifications } from "@/store";
import {
  Bell,
  BellOff,
  Plus,
  Mail,
  Smartphone,
  Slack,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Send,
  Filter,
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
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
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.unread}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.thisWeek}
            </div>
          </CardContent>
        </Card>
      </div>

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
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
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
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="Notification message"
                rows={3}
              />
            </div>
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
                    }))
                  }
                >
                  <SelectTrigger>
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
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
