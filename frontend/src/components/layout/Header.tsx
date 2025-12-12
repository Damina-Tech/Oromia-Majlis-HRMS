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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/store";
import { listNotifications, markNotificationsRead } from "@/services/notifications";
import type { InboxNotification } from "@/services/notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { resolveAvatarUrl } from "@/config/api";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

const getInitials = (firstName: string, lastName: string) => {
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
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllRead}
                  disabled={loadingNotifications || unreadCount === 0}
                >
                  Mark all read
                </Button>
              </DropdownMenuLabel>
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
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                    {getInitials(user?.firstName || "", user?.lastName || "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
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
