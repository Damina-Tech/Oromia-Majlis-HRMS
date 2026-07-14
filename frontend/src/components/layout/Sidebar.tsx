import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Timer,
  ChevronDown,
  CheckSquare,
  Handshake,
  Landmark,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
}

const menuItems = [
{
  id: 'dashboard',
  icon: BarChart3,
  href: '/dashboard',
  permission: 'dashboard.view'
},
{
  id: 'employees',
  icon: Users,
  href: '/employees',
  permission: 'employees.read'
},
{
  id: 'sectors',
  icon: Building2,
  href: '/organization',
  permission: 'organization.view'
},
{
  id: 'majlisInstitutions',
  icon: Landmark,
  href: '/majlis/institutions',
  permission: 'majlis.institutions.read',
  submenu: true,
},
{
  id: 'membership',
  icon: UserPlus,
  href: '/majlis/membership',
  permission: 'majlis.membership.view',
  submenu: true,
},
{
  id: 'halalCertification',
  icon: ShieldCheck,
  href: '/halal/dashboard',
  permission: 'halal.business', // also show for halal.admin, halal.inspector, halal.supervisor - checked in filteredMenuItems
  submenu: true,
},
{
  id: 'leaveManagement',
  icon: Calendar,
  href: '/leave',
  permission: 'leave.view'
},
{
  id: 'attendance',
  icon: Clock,
  href: '/attendance',
  permission: 'attendance.view'
},
// Payroll hidden for now — re-enable when module is ready
// {
//   id: 'payroll',
//   icon: DollarSign,
//   href: '/payroll',
//   permission: 'payroll.view'
// },
// {
//   title: 'Leads',
//   icon: Handshake,
//   href: '/leads',
//   permission: 'leads.read'
// },
{
  id: 'tasks',
  icon: CheckSquare,
  href: '/tasks',
  permission: 'tasks.view',
  submenu: true,
},
{
  id: 'assets',
  icon: Archive,
  href: '/assets',
  permission: 'assets.view'
},
// {
//   id: 'expenses',
//   icon: CreditCard,
//   href: '/expenses',
//   permission: 'expense.view',
//   submenu: true,
// },
{
  id: 'documents',
  icon: FileText,
  href: '/documents',
  permission: 'documents.view',
  submenu: true,
},
{
  id: 'announcements',
  icon: Bell,
  href: '/announcements',
  permission: '*', // Show to all authenticated users since listAnnouncements route doesn't require permission
  submenu: true,
},
{
  id: 'reports',
  icon: BarChart3,
  href: '/reports',
  permission: 'reports.view'
},
// {
//   title: 'Onboarding',
//   icon: UserPlus,
//   href: '/onboarding',
//   permission: 'onboarding.view'
// },
{
  id: 'notifications',
  icon: Bell,
  href: '/notifications',
  permission: 'notifications.view'
}];


const adminItems = [
{
  id: 'accessControl',
  icon: Shield,
  href: '/admin/access-control',
  permission: 'divisions.read'
},
{
  id: 'userManagement',
  icon: Shield,
  href: '/admin/users',
  permission: 'users.read'
},
{
  id: 'systemSettings',
  icon: Settings,
  href: '/admin/settings',
  permission: '*'
}];


const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { t } = useTranslation();
  const { user, logout, hasPermission, refreshUserData, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Keep sidebar permissions in sync with backend (role + user-specific overrides).
  // This ensures removed permissions are reflected without requiring manual logout/login.
  React.useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (!mounted) return;
      await refreshUserData();
    };

    refresh();

    const onFocus = () => {
      refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Permission-first access model: keep role checks only for identity/display, not for access gating.
  const isEmployee = user?.roles?.some(role => role.toUpperCase() === 'EMPLOYEE') || false;

  const isHalalBusinessOnly = user?.roles?.some(r => r.toUpperCase() === 'HALAL_BUSINESS') &&
    !user?.roles?.some(r => ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].includes(r.toUpperCase()));

  const isHalalCompetencyOnly =
    user?.roles?.some((r) => r.toUpperCase() === "HALAL_COMPETENCY") &&
    !user?.roles?.some((r) =>
      ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "MAJLIS_REPRESENTATIVE", "MEMBER", "HALAL_BUSINESS"].includes(r.toUpperCase()),
    );

  const isHalalStaffAny =
    hasPermission("halal.admin") ||
    hasPermission("halal.supervisor") ||
    hasPermission("halal.inspector") ||
    hasPermission("halal.committee") ||
    hasPermission("halal.review") ||
    hasPermission("halal.finance") ||
    hasPermission("halal.audit");
  const hideHalalCompetencyForBusinessPortal =
    user?.roles?.some((r) => r.toUpperCase() === "HALAL_BUSINESS") && !isHalalStaffAny;

  // Member-only: has MEMBER (or majlis.member) and no staff roles — their default is My Membership
  const isMemberOnly = hasPermission('majlis.member') &&
    !user?.roles?.some(r => ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'MAJLIS_REPRESENTATIVE'].includes(r.toUpperCase()));

  const filteredMenuItems = menuItems.filter((item) => {
    // Hide main Dashboard only for Halal-only or Member-only users (permission-based: show when user has dashboard.view)
    if (item.id === 'dashboard') {
      if (isHalalBusinessOnly) return false;
      if (isHalalCompetencyOnly) return false;
      if (isMemberOnly) return false;
      return hasPermission('dashboard.view');
    }
    // Always show items with '*' permission (for authenticated users)
    if (item.permission === '*') {
      return true;
    }
    // Membership: show for admin/representative or for member portal
    if (item.id === 'membership') {
      return (
        hasPermission('majlis.membership.view') ||
        hasPermission('majlis.membership.register') ||
        hasPermission('majlis.membership.admin') ||
        hasPermission('majlis.member')
      );
    }
    // Halal Certification: show for any halal permission
    if (item.id === 'halalCertification') {
      return (
        hasPermission('halal.business') ||
        hasPermission('halal.competency') ||
        hasPermission('halal.admin') ||
        hasPermission('halal.inspector') ||
        hasPermission('halal.supervisor') ||
        hasPermission('halal.renew') ||
        hasPermission('halal.committee') ||
        hasPermission('halal.review') ||
        hasPermission('halal.finance') ||
        hasPermission('halal.audit')
      );
    }
    // Check specific permission
    return hasPermission(item.permission);
  });

  const filteredAdminItems = adminItems.filter((item) => {
    if (item.id === 'accessControl') {
      return isSuperAdmin() || hasPermission('divisions.read') || hasPermission('divisions.manage');
    }
    if (item.id === 'userManagement') {
      return isSuperAdmin() || hasPermission('users.read') || hasPermission('users.write');
    }
    if (item.permission === '*') return true;
    return hasPermission(item.permission);
  });

  // Leave Management submenu items
  const leaveSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Only show Leave Management submenu items if user has leave.view permission
  if (hasPermission('leave.view') || hasPermission('leave.read') || hasPermission('leave.manage')) {
    leaveSubmenuItems.push({ titleKey: 'leaveMyMgmt', href: '/leave', permission: 'leave.view' });
    
    // Show when user has explicit permissions (role-based or user-specific).
    if (hasPermission('leave.read')) {
      leaveSubmenuItems.push({ titleKey: 'leaveRequests', href: '/leave-requests', permission: 'leave.view' });
      leaveSubmenuItems.push({ titleKey: 'leaveBalance', href: '/leave-balances', permission: 'leave.read' });
    }
  }

  // Attendance submenu items
  const attendanceSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Only show Attendance submenu items if user has attendance.view permission
  if (hasPermission('attendance.view') || hasPermission('attendance.read') || hasPermission('attendance.manage')) {
    attendanceSubmenuItems.push({ titleKey: 'attendanceMy', href: '/attendance', permission: 'attendance.view' });
    
    if (hasPermission('attendance.read')) {
      attendanceSubmenuItems.push({ titleKey: 'attendanceRecords', href: '/attendance-records', permission: 'attendance.read' });
    }
  }

  // Payroll submenu items
  const payrollSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Only show Payroll submenu items if user has payroll.view permission
  if (hasPermission('payroll.view') || hasPermission('payroll.process')) {
    // All users can see their own salary portal
    payrollSubmenuItems.push({ titleKey: 'payrollMySalary', href: '/my-salary', permission: 'payroll.view' });
    
    if (hasPermission('payroll.view')) {
      payrollSubmenuItems.push({ titleKey: 'payrollRuns', href: '/payroll/runs', permission: 'payroll.view' });
      payrollSubmenuItems.push({ titleKey: 'payrollLoans', href: '/payroll/loans', permission: 'payroll.view' });
      payrollSubmenuItems.push({ titleKey: 'payrollAdvances', href: '/payroll/advances', permission: 'payroll.view' });
    }
    if (hasPermission('payroll.process')) {
      payrollSubmenuItems.push({ titleKey: 'payrollSalaryGrades', href: '/payroll/salary-grades', permission: 'payroll.process' });
      payrollSubmenuItems.push({ titleKey: 'payrollAllowances', href: '/payroll/allowances', permission: 'payroll.process' });
      payrollSubmenuItems.push({ titleKey: 'payrollTaxPension', href: '/payroll/tax-pension', permission: 'payroll.process' });
    }
  }

  // Assets submenu items
  const assetSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Only show Assets submenu items if user has assets.view permission
  if (hasPermission('assets.view') || hasPermission('assets.manage')) {
    assetSubmenuItems.push({ titleKey: 'assetsList', href: '/assets', permission: 'assets.view' });
    assetSubmenuItems.push({ titleKey: 'assetsDashboard', href: '/assets/dashboard', permission: 'assets.view' });
    assetSubmenuItems.push({ titleKey: 'assetsReports', href: '/assets/reports', permission: 'assets.view' });
  }

  // Documents submenu items
  const documentSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Permission-based visibility, including user-specific overrides.
  if (hasPermission('documents.view') || hasPermission('documents.manage')) {
    if (hasPermission('documents.manage')) {
      documentSubmenuItems.push({ titleKey: 'docTemplates', href: '/documents/templates', permission: 'documents.view' });
      documentSubmenuItems.push({ titleKey: 'docCertificateTemplates', href: '/documents/certificate-templates', permission: 'documents.view' });
      documentSubmenuItems.push({ titleKey: 'docGenerate', href: '/documents/generate', permission: 'documents.view' });
    }
    documentSubmenuItems.push({ titleKey: 'docRequests', href: '/documents/requests', permission: 'documents.view' });
    if (hasPermission('documents.manage')) {
      documentSubmenuItems.push({ titleKey: 'docSettings', href: '/documents/settings', permission: 'documents.manage' });
    }
  }

  // Announcements submenu items
  const announcementSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  // Show Inbox/All Announcements to all authenticated users (since listAnnouncements doesn't require permission)
  announcementSubmenuItems.push({ titleKey: 'announceInbox', href: '/announcements', permission: '*' });
  
  // Show Create to users with create permission
  if (hasPermission('announcements.create')) {
    announcementSubmenuItems.push({ titleKey: 'announceCreate', href: '/announcements/create', permission: 'announcements.create' });
  }

  // Tasks submenu items
  const taskSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  if (hasPermission('tasks.view')) {
    taskSubmenuItems.push({ titleKey: 'tasksList', href: '/tasks', permission: 'tasks.view' });
    taskSubmenuItems.push({ titleKey: 'tasksKanban', href: '/tasks/kanban', permission: 'tasks.view' });
    if (hasPermission('tasks.manage') || hasPermission('reports.view')) {
      taskSubmenuItems.push({ titleKey: 'tasksDashboard', href: '/tasks/dashboard', permission: 'tasks.view' });
    }
  }

  // Expenses submenu items
  const expenseSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  if (hasPermission('expense.view')) {
    expenseSubmenuItems.push({ titleKey: 'expensesMy', href: '/expenses', permission: 'expense.view' });
  }
  if (hasPermission('expense.approve')) {
    expenseSubmenuItems.push({ titleKey: 'expensesApproval', href: '/expenses/approval-queue', permission: 'expense.approve' });
  }
  if (hasPermission('expense.view_all')) {
    expenseSubmenuItems.push({ titleKey: 'expensesAll', href: '/expenses/all', permission: 'expense.view_all' });
  }

  const canSeeHalalSub = (sub: { permission?: string; anyOfPermissions?: string[] }) => {
    if (sub.anyOfPermissions?.length) return sub.anyOfPermissions.some((p) => hasPermission(p));
    return sub.permission ? hasPermission(sub.permission) : false;
  };

  // Halal Certification submenu items
  const halalSubmenuItems: Array<{ titleKey: string; href: string; permission?: string; anyOfPermissions?: string[] }> =
    [];
  if (
    hasPermission('halal.business') ||
    hasPermission('halal.competency') ||
    hasPermission('halal.admin') ||
    hasPermission('halal.inspector') ||
    hasPermission('halal.supervisor') ||
    hasPermission('halal.renew') ||
    hasPermission('halal.committee') ||
    hasPermission('halal.review') ||
    hasPermission('halal.finance') ||
    hasPermission('halal.audit')
  ) {
    halalSubmenuItems.push({ titleKey: 'halalDashboard', href: '/halal/dashboard', permission: 'dashboard.view' });
    if (hasPermission('halal.business') || hasPermission('halal.admin') || hasPermission('halal.supervisor')) {
      halalSubmenuItems.push({ titleKey: 'halalBusinesses', href: '/halal/register', permission: 'halal.business' });
      halalSubmenuItems.push({ titleKey: 'halalApplications', href: '/halal/apply', permission: 'halal.business' });
      halalSubmenuItems.push({ titleKey: 'halalCertificates', href: '/halal/certificates', permission: 'halal.business' });
    }
    if (
      !hideHalalCompetencyForBusinessPortal &&
      (hasPermission('halal.competency') ||
        hasPermission('halal.admin') ||
        hasPermission('halal.supervisor') ||
        hasPermission('halal.committee') ||
        hasPermission('halal.review') ||
        hasPermission('halal.finance') ||
        hasPermission('halal.audit'))
    ) {
      halalSubmenuItems.push({ titleKey: 'halalCompetency', href: '/halal/competency', permission: 'halal.competency' });
    }
    if (hasPermission('halal.admin') || hasPermission('halal.inspector') || hasPermission('halal.supervisor')) {
      halalSubmenuItems.push({ titleKey: 'halalInspection', href: '/admin/halal/inspections', permission: 'halal.inspector' });
    }
    if (hasPermission('halal.admin')) {
      halalSubmenuItems.push({ titleKey: 'halalViolations', href: '/admin/halal/violations', permission: 'halal.admin' });
    }
    halalSubmenuItems.push({
      titleKey: 'halalReport',
      href: '/halal/reports',
      anyOfPermissions: ['halal.admin', 'halal.supervisor', 'halal.finance', 'halal.audit', 'halal.committee', 'halal.review'],
    });
  }

  // Majlis Institutions submenu items
  const majlisSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  
  if (hasPermission('majlis.institutions.read') || hasPermission('majlis.dashboard.view')) {
    if (hasPermission('majlis.dashboard.view')) {
      majlisSubmenuItems.push({ titleKey: 'majlisDashboard', href: '/majlis/dashboard', permission: 'majlis.dashboard.view' });
    }
    majlisSubmenuItems.push({ titleKey: 'majlisInstitutions', href: '/majlis/institutions', permission: 'majlis.institutions.read' });
    if (hasPermission('majlis.assignments.read')) {
      majlisSubmenuItems.push({ titleKey: 'majlisAssignments', href: '/majlis/assignments', permission: 'majlis.assignments.read' });
    }
    if (hasPermission('reports.view')) {
      majlisSubmenuItems.push({ titleKey: 'majlisReports', href: '/majlis/reports', permission: 'reports.view' });
    }
  }

  // Membership submenu items
  const membershipSubmenuItems: Array<{ titleKey: string; href: string; permission: string }> = [];
  if (hasPermission('majlis.membership.view') || hasPermission('majlis.membership.register') || hasPermission('majlis.membership.admin')) {
    membershipSubmenuItems.push({ titleKey: 'membershipDashboard', href: '/majlis/membership', permission: 'majlis.membership.view' });
    membershipSubmenuItems.push({ titleKey: 'membershipMembers', href: '/majlis/membership/members', permission: 'majlis.membership.view' });
    membershipSubmenuItems.push({ titleKey: 'membershipRegister', href: '/majlis/membership/register', permission: 'majlis.membership.register' });
  }
  if (hasPermission('majlis.member')) {
    membershipSubmenuItems.push({ titleKey: 'membershipMy', href: '/my-membership', permission: 'majlis.member' });
  }
  
  // Create Task is handled via dialog on the tasks list page, no separate route needed

  // Auto-expand and auto-close submenus based on current route
  React.useEffect(() => {
    const newExpandedItems = new Set<string>();
    
    // Determine which submenu should be active based on current route
    if (location.pathname.startsWith('/leave')) {
      newExpandedItems.add('leaveManagement');
    } else if (location.pathname.startsWith('/attendance')) {
      newExpandedItems.add('attendance');
    } else if (location.pathname.startsWith('/payroll') || location.pathname.startsWith('/my-salary')) {
      newExpandedItems.add('payroll');
    } else if (location.pathname.startsWith('/assets')) {
      newExpandedItems.add('assets');
    } else if (location.pathname.startsWith('/expenses')) {
      newExpandedItems.add('expenses');
    } else if (location.pathname.startsWith('/documents')) {
      newExpandedItems.add('documents');
    } else if (location.pathname.startsWith('/announcements')) {
      newExpandedItems.add('announcements');
    } else if (location.pathname.startsWith('/tasks')) {
      newExpandedItems.add('tasks');
    } else if (location.pathname.startsWith('/majlis/membership') || location.pathname.startsWith('/my-membership')) {
      newExpandedItems.add('membership');
    } else if (location.pathname.startsWith('/majlis')) {
      newExpandedItems.add('majlisInstitutions');
    } else if (location.pathname.startsWith('/halal') || location.pathname.startsWith('/admin/halal')) {
      newExpandedItems.add('halalCertification');
    }
    
    // Only update if the active submenu has changed
    setExpandedItems(newExpandedItems);
  }, [location.pathname]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set<string>();
      
      // Check if the clicked item is the currently active submenu based on route
      const isActiveSubmenu = (
        (itemId === 'leaveManagement' && location.pathname.startsWith('/leave')) ||
        (itemId === 'attendance' && location.pathname.startsWith('/attendance')) ||
        (itemId === 'payroll' && (location.pathname.startsWith('/payroll') || location.pathname.startsWith('/my-salary'))) ||
        (itemId === 'assets' && location.pathname.startsWith('/assets')) ||
        (itemId === 'expenses' && location.pathname.startsWith('/expenses')) ||
        (itemId === 'documents' && location.pathname.startsWith('/documents')) ||
        (itemId === 'announcements' && location.pathname.startsWith('/announcements')) ||
        (itemId === 'tasks' && location.pathname.startsWith('/tasks')) ||
        (itemId === 'majlisInstitutions' && location.pathname.startsWith('/majlis')) ||
        (itemId === 'membership' && (location.pathname.startsWith('/majlis/membership') || location.pathname.startsWith('/my-membership'))) ||
        (itemId === 'halalCertification' && (location.pathname.startsWith('/halal') || location.pathname.startsWith('/admin/halal')))
      );
      
      // If clicking on the currently active submenu, keep it open (don't allow closing)
      if (isActiveSubmenu) {
        next.add(itemId);
      } else if (!prev.has(itemId)) {
        // Open the clicked submenu (this will close others since we're creating a new Set)
        next.add(itemId);
      } else {
        // It's expanded but not active - allow closing it
        // Don't add it to next, so it closes
      }
      
      return next;
    });
  };

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
              <h1 className="text-lg font-bold text-gray-900" data-id="00zu1xik0" data-path="src/components/layout/Sidebar.tsx">
                {t("sidebar.appTitle")}
              </h1>
              <p className="text-xs text-gray-500" data-id="fix24iosm" data-path="src/components/layout/Sidebar.tsx">
                {t("sidebar.appSubtitle")}
              </p>
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
            const isLeaveManagement = item.id === 'leaveManagement';
            const isAttendance = item.id === 'attendance';
            const isAssets = item.id === 'assets';
            const isDocuments = item.id === 'documents';
            const isAnnouncements = item.id === 'announcements';
            const isExpanded = expandedItems.has(item.id);
            const isLeavePage = location.pathname.startsWith('/leave');
            const isAttendancePage = location.pathname.startsWith('/attendance');
            const isAssetsPage = location.pathname.startsWith('/assets');
            const isDocumentsPage = location.pathname.startsWith('/documents');
            const isAnnouncementsPage = location.pathname.startsWith('/announcements');
            
            if (isLeaveManagement && leaveSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isLeavePage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {leaveSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            if (isAttendance && attendanceSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isAttendancePage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {attendanceSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (isAssets && assetSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isAssetsPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {assetSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (isDocuments && documentSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isDocumentsPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {documentSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (isAnnouncements && announcementSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isAnnouncementsPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {announcementSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isTasks = item.id === 'tasks';
            const isTasksPage = location.pathname.startsWith('/tasks');
            
            if (isTasks && taskSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isTasksPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {taskSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isExpenses = item.id === 'expenses';
            const isExpensesPage = location.pathname.startsWith('/expenses');
            
            if (isExpenses && expenseSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isExpensesPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {expenseSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isPayroll = item.id === 'payroll';
            const isPayrollPage = location.pathname.startsWith('/payroll') || location.pathname.startsWith('/my-salary');
            
            const isMajlis = item.id === 'majlisInstitutions';
            const isMajlisPage = location.pathname.startsWith('/majlis');
            
            if (isMajlis && majlisSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isMajlisPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {majlisSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isMembership = item.id === 'membership';
            const isMembershipPage =
              location.pathname.startsWith('/majlis/membership') || location.pathname.startsWith('/my-membership');
            if (isMembership && membershipSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isMembershipPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {membershipSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isHalal = item.id === 'halalCertification';
            const isHalalPage = location.pathname.startsWith('/halal') || location.pathname.startsWith('/admin/halal');
            if (isHalal && halalSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isHalalPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {halalSubmenuItems.filter((subItem) => canSeeHalalSub(subItem)).map((subItem) => (
                        <NavLink
                          key={subItem.href + subItem.titleKey}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (isPayroll && payrollSubmenuItems.length > 0 && !isCollapsed) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isExpanded || isPayrollPage ?
                      'bg-blue-50 text-blue-700 border-r-2 border-blue-700' :
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {t(`sidebar.menu.${item.id}`)}
                    {isExpanded ? 
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" /> :
                      <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                    }
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {payrollSubmenuItems.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive ?
                              'bg-blue-100 text-blue-800 font-medium' :
                              'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          <span className="ml-5">{t(`sidebar.sub.${subItem.titleKey}`)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
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
                    {t(`sidebar.menu.${item.id}`)}
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
                {!isCollapsed ? t("sidebar.adminSection") : t("sidebar.adminSection").charAt(0)}
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
                        {t(`sidebar.menu.${item.id}`)}
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
          {!isCollapsed && t("sidebar.logout")}
        </Button>
      </div>
    </div>);

};

export default Sidebar;