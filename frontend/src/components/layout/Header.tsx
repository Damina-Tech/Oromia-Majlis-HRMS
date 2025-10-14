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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
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
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
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
                Notifications
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  data-id="ms1kqkmqx"
                  data-path="src/components/layout/Header.tsx"
                >
                  Mark all read
                </Button>
              </DropdownMenuLabel>
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
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                    {getInitials(user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
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
                    {user?.name}
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
                    {user?.role.toUpperCase()}
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
