import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  Menu,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";
<<<<<<< HEAD
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
=======
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { listNotifications, markNotificationsRead } from "@/services/notifications";
import type { InboxNotification } from "@/services/notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
>>>>>>> dev

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

const getInitials = (firstName: string, lastName: string) => {
<<<<<<< HEAD
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isCollapsed }) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  const notifications = [
    {
      id: 1,
      message: "New leave request from Alice Employee",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      message: "Payroll processing completed",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      message: "Monthly report is ready",
      time: "2 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className="bg-white border-b border-gray-200 px-6 py-4"
      data-id="4rqgu5shv"
      data-path="src/components/layout/Header.tsx"
    >
      <div
        className="flex items-center justify-between"
        data-id="pj9p3bf9m"
        data-path="src/components/layout/Header.tsx"
      >
        {/* Left Section */}
        <div
          className="flex items-center space-x-4"
          data-id="1096b5kw8"
          data-path="src/components/layout/Header.tsx"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2"
            data-id="gwxruzjrh"
            data-path="src/components/layout/Header.tsx"
          >
            <Menu
              className="h-5 w-5"
              data-id="qa5g654y5"
              data-path="src/components/layout/Header.tsx"
            />
          </Button>

          {/* Search Bar */}
          <div
            className="relative hidden md:block"
            data-id="w9jvayqqi"
            data-path="src/components/layout/Header.tsx"
          >
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              data-id="m79qgurx4"
              data-path="src/components/layout/Header.tsx"
            />
            <Input
              placeholder="Search employees, departments..."
              className="pl-10 w-80"
              data-id="qh5v0ojwx"
              data-path="src/components/layout/Header.tsx"
            />
          </div>
        </div>

        {/* Right Section */}
        <div
          className="flex items-center space-x-4"
          data-id="n5jz4un9t"
          data-path="src/components/layout/Header.tsx"
        >
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark(!isDark)}
            className="p-2"
            data-id="80hkbdl3z"
            data-path="src/components/layout/Header.tsx"
          >
            {isDark ? (
              <Sun
                className="h-5 w-5"
                data-id="1gq4sdnan"
                data-path="src/components/layout/Header.tsx"
              />
            ) : (
              <Moon
                className="h-5 w-5"
                data-id="56ulqp809"
                data-path="src/components/layout/Header.tsx"
              />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu
            data-id="thot3m9r0"
            data-path="src/components/layout/Header.tsx"
          >
            <DropdownMenuTrigger
              asChild
              data-id="l81tifwrn"
              data-path="src/components/layout/Header.tsx"
            >
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
                data-id="so3n5t70m"
                data-path="src/components/layout/Header.tsx"
              >
                <Bell
                  className="h-5 w-5"
                  data-id="95ltezrv3"
                  data-path="src/components/layout/Header.tsx"
                />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-id="fx7ta8pe0"
                    data-path="src/components/layout/Header.tsx"
                  >
=======
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(false);
  const [recentNotifications, setRecentNotifications] = React.useState<InboxNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);
  const unreadCount = useStore((state) => state.unreadCount);
  const setUnreadCount = useStore((state) => state.setUnreadCount);
  const markLocalRead = useStore((state) => state.markLocalRead);

  const apiBaseUrl = React.useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:4000", []);
  const resolveAvatarUrl = React.useCallback(
    (value?: string | null) => {
      if (!value) return undefined;
      if (value.startsWith("http")) return value;
      return `${apiBaseUrl}${value}`;
    },
    [apiBaseUrl]
  );
  const userAvatarSrc = resolveAvatarUrl(user?.avatarUrl ?? null);

  const fetchHeaderNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const [recent, unread] = await Promise.all([
        listNotifications({ page: 1, pageSize: 6 }),
        listNotifications({ page: 1, pageSize: 1, isRead: false }),
      ]);
      setRecentNotifications(recent.items);
      setUnreadCount(unread.total);
    } catch (error: any) {
      console.error("Failed to load header notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user, setUnreadCount]);

  React.useEffect(() => {
    if (!user) {
      setRecentNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchHeaderNotifications();
    const interval = setInterval(fetchHeaderNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchHeaderNotifications, user, setUnreadCount]);

  const handleMarkAllRead = async () => {
    const unreadIds = recentNotifications.filter((notification) => !notification.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markNotificationsRead(unreadIds, true);
      markLocalRead(unreadIds, true);
      fetchHeaderNotifications();
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Failed to mark notifications", error);
      toast.error(error?.response?.data?.message ?? "Failed to update notifications");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="p-2">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search employees, departments..." className="pl-10 w-80" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setIsDark(!isDark)} className="p-2">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
>>>>>>> dev
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
<<<<<<< HEAD
            <DropdownMenuContent
              align="end"
              className="w-80"
              data-id="u4efa1lec"
              data-path="src/components/layout/Header.tsx"
            >
              <DropdownMenuLabel
                className="flex items-center justify-between"
                data-id="8uyhcjndu"
                data-path="src/components/layout/Header.tsx"
              >
=======
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
>>>>>>> dev
                Notifications
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
<<<<<<< HEAD
                  data-id="ms1kqkmqx"
                  data-path="src/components/layout/Header.tsx"
=======
                  onClick={handleMarkAllRead}
                  disabled={loadingNotifications || unreadCount === 0}
>>>>>>> dev
                >
                  Mark all read
                </Button>
              </DropdownMenuLabel>
<<<<<<< HEAD
              <DropdownMenuSeparator
                data-id="3dt2r6psc"
                data-path="src/components/layout/Header.tsx"
              />
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-4"
                  data-id="gc9a8fb34"
                  data-path="src/components/layout/Header.tsx"
                >
                  <div
                    className="flex items-center justify-between w-full"
                    data-id="ekzs09m9k"
                    data-path="src/components/layout/Header.tsx"
                  >
                    <p
                      className={`text-sm ${
                        notification.unread ? "font-medium" : "text-gray-600"
                      }`}
                      data-id="ulju4jo6b"
                      data-path="src/components/layout/Header.tsx"
                    >
                      {notification.message}
                    </p>
                    {notification.unread && (
                      <div
                        className="h-2 w-2 bg-blue-600 rounded-full"
                        data-id="c6fgg2mmo"
                        data-path="src/components/layout/Header.tsx"
                      ></div>
                    )}
                  </div>
                  <p
                    className="text-xs text-gray-500 mt-1"
                    data-id="t23dcthx9"
                    data-path="src/components/layout/Header.tsx"
                  >
                    {notification.time}
                  </p>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator
                data-id="mrdrykd8c"
                data-path="src/components/layout/Header.tsx"
              />
              <DropdownMenuItem
                className="text-center text-blue-600 hover:text-blue-700"
                data-id="0ay0omfwu"
                data-path="src/components/layout/Header.tsx"
              >
                View all notifications
=======
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  Loading notifications...
                </DropdownMenuItem>
              ) : recentNotifications.length === 0 ? (
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  No notifications yet
                </DropdownMenuItem>
              ) : (
                recentNotifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-4">
                    <div className="flex items-center justify-between w-full">
                      <p className={`text-sm ${notification.isRead ? "text-gray-600" : "font-medium"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && <div className="h-2 w-2 bg-blue-600 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-blue-600 hover:text-blue-700" asChild>
                <a href="/notifications">View all notifications</a>
>>>>>>> dev
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

<<<<<<< HEAD
          {/* Help */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            data-id="7px4cynoy"
            data-path="src/components/layout/Header.tsx"
          >
            <HelpCircle
              className="h-5 w-5"
              data-id="54ubegnbu"
              data-path="src/components/layout/Header.tsx"
            />
          </Button>

          {/* User Menu */}
          <DropdownMenu
            data-id="bp1vpvywc"
            data-path="src/components/layout/Header.tsx"
          >
            <DropdownMenuTrigger
              asChild
              data-id="aixop2sri"
              data-path="src/components/layout/Header.tsx"
            >
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-full p-0"
                data-id="ghx34a66r"
                data-path="src/components/layout/Header.tsx"
              >
                <Avatar
                  className="h-9 w-9"
                  data-id="6yar2w63i"
                  data-path="src/components/layout/Header.tsx"
                >
                  <AvatarFallback
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    data-id="qbdfefzyz"
                    data-path="src/components/layout/Header.tsx"
                  >
=======
          <Button variant="ghost" size="sm" className="p-2">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  {userAvatarSrc && (
                    <AvatarImage src={userAvatarSrc} alt={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} />
                  )}
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
>>>>>>> dev
                    {getInitials(user?.firstName || "", user?.lastName || "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
<<<<<<< HEAD
            <DropdownMenuContent
              align="end"
              className="w-56"
              data-id="cj5c5uchf"
              data-path="src/components/layout/Header.tsx"
            >
              <DropdownMenuLabel
                data-id="t9e4307iy"
                data-path="src/components/layout/Header.tsx"
              >
                <div
                  className="flex flex-col space-y-1"
                  data-id="6zx3zdgrk"
                  data-path="src/components/layout/Header.tsx"
                >
                  <p
                    className="text-sm font-medium"
                    data-id="evfyz9g2u"
                    data-path="src/components/layout/Header.tsx"
                  >
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    data-id="hv2a0ikpb"
                    data-path="src/components/layout/Header.tsx"
                  >
                    {user?.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className="w-fit text-xs"
                    data-id="1jj8sqv3l"
                    data-path="src/components/layout/Header.tsx"
                  >
                    {user?.roles?.[0]?.toUpperCase() || 'USER'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator
                data-id="4h67h1c99"
                data-path="src/components/layout/Header.tsx"
              />
              <DropdownMenuItem
                data-id="z1lqi8gul"
                data-path="src/components/layout/Header.tsx"
              >
                <User
                  className="mr-2 h-4 w-4"
                  data-id="6din92n2g"
                  data-path="src/components/layout/Header.tsx"
                />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                data-id="mrrzdt516"
                data-path="src/components/layout/Header.tsx"
              >
                <Settings
                  className="mr-2 h-4 w-4"
                  data-id="0gwd0i9jx"
                  data-path="src/components/layout/Header.tsx"
                />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator
                data-id="1h8ok00g9"
                data-path="src/components/layout/Header.tsx"
              />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600"
                data-id="l2rsu9wrv"
                data-path="src/components/layout/Header.tsx"
              >
                <LogOut
                  className="mr-2 h-4 w-4"
                  data-id="ykjkgukap"
                  data-path="src/components/layout/Header.tsx"
                />
=======
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {user?.roles?.[0]?.toUpperCase() || "USER"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
>>>>>>> dev
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
