import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Briefcase,
  CreditCard,
  MapPin,
  Bell,
  Archive,
  UserPlus,
  LogOut,
  ChevronRight,
  Timer } from
'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

const menuItems = [
{
  title: 'Dashboard',
  icon: BarChart3,
  href: '/dashboard',
  permission: 'dashboard.view'
},
{
  title: 'Employees',
  icon: Users,
  href: '/employees',
  permission: 'employees.read'
},
{
  title: 'Organization',
  icon: Building2,
  href: '/organization',
  permission: 'organization.view'
},
{
  title: 'Leave Management',
  icon: Calendar,
  href: '/leave',
  permission: 'leave.view'
},
{
  title: 'Attendance',
  icon: Clock,
  href: '/attendance',
  permission: 'attendance.view'
},
{
  title: 'Payroll',
  icon: DollarSign,
  href: '/payroll',
  permission: 'payroll.view'
},
{
  title: 'Timesheet',
  icon: Timer,
  href: '/timesheet',
  permission: 'timesheet.view'
},
{
  title: 'Assets',
  icon: Archive,
  href: '/assets',
  permission: 'assets.view'
},
{
  title: 'Expenses',
  icon: CreditCard,
  href: '/expenses',
  permission: 'expenses.view'
},
{
  title: 'Documents',
  icon: FileText,
  href: '/documents',
  permission: 'documents.view'
},
{
  title: 'Reports',
  icon: BarChart3,
  href: '/reports',
  permission: 'reports.view'
},
{
  title: 'Onboarding',
  icon: UserPlus,
  href: '/onboarding',
  permission: 'onboarding.view'
},
{
  title: 'Notifications',
  icon: Bell,
  href: '/notifications',
  permission: 'notifications.view'
}];


const adminItems = [
{
  title: 'User Management',
  icon: Shield,
  href: '/admin/users',
  permission: '*'
},
{
  title: 'System Settings',
  icon: Settings,
  href: '/admin/settings',
  permission: '*'
}];


const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout, hasPermission } = useAuth();

  const filteredMenuItems = menuItems.filter((item) =>
  item.permission === '*' || hasPermission(item.permission)
  );

  const filteredAdminItems = adminItems.filter((item) =>
  item.permission === '*' || hasPermission(item.permission)
  );

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
    isCollapsed ? 'w-16' : 'w-64'} h-full flex flex-col`
    } data-id="3ce1ss1zx" data-path="src/components/layout/Sidebar.tsx">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200" data-id="n4gahyf58" data-path="src/components/layout/Sidebar.tsx">
        <div className="flex items-center space-x-3" data-id="trw5ahq22" data-path="src/components/layout/Sidebar.tsx">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center" data-id="cr39wgsho" data-path="src/components/layout/Sidebar.tsx">
            <Building2 className="h-5 w-5 text-white" data-id="4s2kuqqzd" data-path="src/components/layout/Sidebar.tsx" />
          </div>
          {!isCollapsed &&
          <div data-id="vhsmmnm2b" data-path="src/components/layout/Sidebar.tsx">
              <h1 className="text-lg font-bold text-gray-900" data-id="00zu1xik0" data-path="src/components/layout/Sidebar.tsx">HRMS</h1>
              <p className="text-xs text-gray-500" data-id="fix24iosm" data-path="src/components/layout/Sidebar.tsx">Portal</p>
            </div>
          }
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user &&
      <div className="p-4 border-b border-gray-200" data-id="7yw383wmm" data-path="src/components/layout/Sidebar.tsx">
          <div className="flex items-center space-x-3" data-id="nh4dbq063" data-path="src/components/layout/Sidebar.tsx">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center" data-id="kjxmlbrk2" data-path="src/components/layout/Sidebar.tsx">
              <span className="text-white font-medium text-sm" data-id="skxif0yac" data-path="src/components/layout/Sidebar.tsx">
                {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
              </span>
            </div>
            <div className="flex-1 min-w-0" data-id="uxi6y0a92" data-path="src/components/layout/Sidebar.tsx">
              <p className="text-sm font-medium text-gray-900 truncate" data-id="3cxcd7hhp" data-path="src/components/layout/Sidebar.tsx">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate" data-id="6i0bmtzoc" data-path="src/components/layout/Sidebar.tsx">
                {user.email}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1" data-id="f5482szou" data-path="src/components/layout/Sidebar.tsx">
                {user.roles?.[0]?.toUpperCase() || 'USER'}
              </span>
            </div>
          </div>
        </div>
      }

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4" data-id="7gjixw7mc" data-path="src/components/layout/Sidebar.tsx">
        <nav className="space-y-1" data-id="vlfl8b3tl" data-path="src/components/layout/Sidebar.tsx">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ?
                'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${
                isCollapsed ? 'justify-center' : ''}`
                } data-id="5ohyipyz1" data-path="src/components/layout/Sidebar.tsx">

                <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} data-id="wisqmjoni" data-path="src/components/layout/Sidebar.tsx" />
                {!isCollapsed &&
                <>
                    {item.title}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" data-id="31g9ykea2" data-path="src/components/layout/Sidebar.tsx" />
                  </>
                }
              </NavLink>);

          })}

          {filteredAdminItems.length > 0 &&
          <>
              <Separator className="my-3" data-id="wihi5eimr" data-path="src/components/layout/Sidebar.tsx" />
              <div className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
            isCollapsed ? 'text-center' : ''}`
            } data-id="u9zr3q5x0" data-path="src/components/layout/Sidebar.tsx">
                {!isCollapsed ? 'Admin' : 'A'}
              </div>
              {filteredAdminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ?
                  'bg-red-50 text-red-700 border-r-2 border-red-700' :
                  'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${
                  isCollapsed ? 'justify-center' : ''}`
                  } data-id="o5qqg63ks" data-path="src/components/layout/Sidebar.tsx">

                    <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} data-id="0kjwqjby3" data-path="src/components/layout/Sidebar.tsx" />
                    {!isCollapsed &&
                  <>
                        {item.title}
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" data-id="06s2g2k8e" data-path="src/components/layout/Sidebar.tsx" />
                      </>
                  }
                  </NavLink>);

            })}
            </>
          }
        </nav>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-200" data-id="jiv1wmmqn" data-path="src/components/layout/Sidebar.tsx">
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'px-2' : 'justify-start'} text-red-600 hover:text-red-700 hover:bg-red-50`}
          onClick={logout} data-id="eae2oox58" data-path="src/components/layout/Sidebar.tsx">

          <LogOut className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} data-id="ay49tknnc" data-path="src/components/layout/Sidebar.tsx" />
          {!isCollapsed && 'Logout'}
        </Button>
      </div>
    </div>);

};

export default Sidebar;