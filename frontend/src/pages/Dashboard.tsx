<<<<<<< HEAD
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
=======
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
>>>>>>> dev
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MapPin,
<<<<<<< HEAD
  FileText } from
'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock dashboard data
  const stats = {
    totalEmployees: 156,
    presentToday: 142,
    onLeave: 8,
    pendingApprovals: 12,
    monthlyPayroll: 450000,
    avgWorkHours: 8.2,
    leaveBalance: user?.role === 'employee' ? 15 : null
  };

  const recentActivities = [
  {
    id: 1,
    type: 'leave',
    message: 'Alice Employee applied for vacation leave',
    time: '10 minutes ago',
    status: 'pending'
  },
  {
    id: 2,
    type: 'attendance',
    message: 'Mike Manager checked in at Office',
    time: '25 minutes ago',
    status: 'success'
  },
  {
    id: 3,
    type: 'payroll',
    message: 'November payroll processing completed',
    time: '2 hours ago',
    status: 'success'
  },
  {
    id: 4,
    type: 'expense',
    message: 'Emma Designer submitted travel expense',
    time: '3 hours ago',
    status: 'pending'
  }];


  const upcomingEvents = [
  {
    id: 1,
    title: 'Team Meeting',
    date: '2024-12-15',
    time: '10:00 AM',
    type: 'meeting'
  },
  {
    id: 2,
    title: 'John Admin Birthday',
    date: '2024-12-16',
    time: 'All Day',
    type: 'birthday'
  },
  {
    id: 3,
    title: 'Payroll Processing',
    date: '2024-12-20',
    time: '2:00 PM',
    type: 'payroll'
  }];


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6" data-id="cr58hlqhk" data-path="src/pages/Dashboard.tsx">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white" data-id="00ip1r0i7" data-path="src/pages/Dashboard.tsx">
        <h1 className="text-2xl font-bold mb-2" data-id="qz27enm1n" data-path="src/pages/Dashboard.tsx">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100" data-id="527991n9l" data-path="src/pages/Dashboard.tsx">
          {user?.role === 'employee' ?
          "Here's your personal dashboard overview" :
          "Here's what's happening in your organization today"
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-id="rt6xji74s" data-path="src/pages/Dashboard.tsx">
        {user?.role !== 'employee' &&
        <>
            <Card data-id="z5sk2g3mz" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="q3bsqw0t0" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="gz9hci4x6" data-path="src/pages/Dashboard.tsx">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" data-id="e6buw4uxd" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="m5witi60n" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="th7y8y4ql" data-path="src/pages/Dashboard.tsx">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground" data-id="5m7auliim" data-path="src/pages/Dashboard.tsx">
                  <span className="text-green-600 flex items-center" data-id="7tirgix2g" data-path="src/pages/Dashboard.tsx">
                    <TrendingUp className="h-3 w-3 mr-1" data-id="3abxko0m8" data-path="src/pages/Dashboard.tsx" />
                    +2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card data-id="bc1fqbsbv" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="af1lf94wx" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="g95gm50ds" data-path="src/pages/Dashboard.tsx">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" data-id="vxgvky7kf" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="nr73id1x3" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="icjqp6yuj" data-path="src/pages/Dashboard.tsx">{stats.presentToday}</div>
                <p className="text-xs text-muted-foreground" data-id="q3rilffp2" data-path="src/pages/Dashboard.tsx">
                  {stats.onLeave} employees on leave
                </p>
                <Progress value={stats.presentToday / stats.totalEmployees * 100} className="mt-2" data-id="tk5ioouuf" data-path="src/pages/Dashboard.tsx" />
              </CardContent>
            </Card>

            <Card data-id="kqf5giwrb" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="5v6wscbs8" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="fmi5zuw8q" data-path="src/pages/Dashboard.tsx">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" data-id="t52zzd4uh" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="n2jaf5od9" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="ket0vrqbr" data-path="src/pages/Dashboard.tsx">${stats.monthlyPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground" data-id="g4ec8nurf" data-path="src/pages/Dashboard.tsx">
                  <span className="text-red-600 flex items-center" data-id="e257jo86u" data-path="src/pages/Dashboard.tsx">
                    <TrendingDown className="h-3 w-3 mr-1" data-id="hvjo6ceai" data-path="src/pages/Dashboard.tsx" />
                    -1.2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        }

        <Card data-id="gzz7to370" data-path="src/pages/Dashboard.tsx">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="dx6798m7o" data-path="src/pages/Dashboard.tsx">
            <CardTitle className="text-sm font-medium" data-id="m66m8f8u7" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? 'Leave Balance' : 'Pending Approvals'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" data-id="x0f35vcjh" data-path="src/pages/Dashboard.tsx" />
          </CardHeader>
          <CardContent data-id="cgmdee7a5" data-path="src/pages/Dashboard.tsx">
            <div className="text-2xl font-bold" data-id="n1pi0sp44" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? stats.leaveBalance : stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground" data-id="4hflcllo6" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? 'days available' : 'require attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-id="hrmg3vmzp" data-path="src/pages/Dashboard.tsx">
        {/* Recent Activities */}
        <Card data-id="a7bkyg03f" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="suw1rsq7e" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="abgzy940m" data-path="src/pages/Dashboard.tsx">Recent Activities</CardTitle>
            <CardDescription data-id="lyv8uprk3" data-path="src/pages/Dashboard.tsx">Latest updates across the organization</CardDescription>
          </CardHeader>
          <CardContent data-id="u54wrz1jo" data-path="src/pages/Dashboard.tsx">
            <div className="space-y-4" data-id="4mdxan87z" data-path="src/pages/Dashboard.tsx">
              {recentActivities.map((activity) =>
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-id="7djpb671h" data-path="src/pages/Dashboard.tsx">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`
                } data-id="z8bwc9mh2" data-path="src/pages/Dashboard.tsx" />
                  <div className="flex-1 min-w-0" data-id="y85jit8qt" data-path="src/pages/Dashboard.tsx">
                    <p className="text-sm font-medium text-gray-900" data-id="og4tn82eg" data-path="src/pages/Dashboard.tsx">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500" data-id="73wxynwx6" data-path="src/pages/Dashboard.tsx">{activity.time}</p>
                  </div>
                  <Badge
                  variant={activity.status === 'success' ? 'default' : 'secondary'}
                  className="text-xs" data-id="d26atjxco" data-path="src/pages/Dashboard.tsx">

                    {activity.status}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-id="u9b4f2pum" data-path="src/pages/Dashboard.tsx">
              View All Activities
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card data-id="f86xw1i00" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="1461gmddw" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="6q678rmdo" data-path="src/pages/Dashboard.tsx">Upcoming Events</CardTitle>
            <CardDescription data-id="igkok7l4k" data-path="src/pages/Dashboard.tsx">Don't miss these important dates</CardDescription>
          </CardHeader>
          <CardContent data-id="6szy1kv00" data-path="src/pages/Dashboard.tsx">
            <div className="space-y-4" data-id="xum5xrliv" data-path="src/pages/Dashboard.tsx">
              {upcomingEvents.map((event) =>
              <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-id="rwexdx3p2" data-path="src/pages/Dashboard.tsx">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                event.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                event.type === 'birthday' ? 'bg-pink-100 text-pink-600' :
                'bg-green-100 text-green-600'}`
                } data-id="3oydhofom" data-path="src/pages/Dashboard.tsx">
                    {event.type === 'meeting' ? <Users className="h-5 w-5" data-id="r9cry2wvi" data-path="src/pages/Dashboard.tsx" /> :
                  event.type === 'birthday' ? <Calendar className="h-5 w-5" data-id="6vpxvtvuu" data-path="src/pages/Dashboard.tsx" /> :
                  <DollarSign className="h-5 w-5" data-id="0vjxps1it" data-path="src/pages/Dashboard.tsx" />}
                  </div>
                  <div className="flex-1 min-w-0" data-id="mymzu6csp" data-path="src/pages/Dashboard.tsx">
                    <p className="text-sm font-medium text-gray-900" data-id="48nivtzpy" data-path="src/pages/Dashboard.tsx">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500" data-id="2wiowt4o7" data-path="src/pages/Dashboard.tsx">
                      {event.date} at {event.time}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-id="rh7ppxkfu" data-path="src/pages/Dashboard.tsx">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {user?.role === 'employee' &&
      <Card data-id="0oa99gnre" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="p1p7bz25y" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="179lzra58" data-path="src/pages/Dashboard.tsx">Quick Actions</CardTitle>
            <CardDescription data-id="j7nx9jdk0" data-path="src/pages/Dashboard.tsx">Frequently used features</CardDescription>
          </CardHeader>
          <CardContent data-id="g4utudig2" data-path="src/pages/Dashboard.tsx">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-id="0q86qit97" data-path="src/pages/Dashboard.tsx">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="4et77xwo2" data-path="src/pages/Dashboard.tsx">
                <MapPin className="h-6 w-6" data-id="rcq0rlrg1" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="aligl315d" data-path="src/pages/Dashboard.tsx">Check In</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="r8g3lqzg0" data-path="src/pages/Dashboard.tsx">
                <Calendar className="h-6 w-6" data-id="jopeqi5gc" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="nv1euyrkx" data-path="src/pages/Dashboard.tsx">Apply Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="80v8o19k7" data-path="src/pages/Dashboard.tsx">
                <FileText className="h-6 w-6" data-id="zgzravntl" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="rbmz7ucmq" data-path="src/pages/Dashboard.tsx">Submit Expense</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="whnrp1dvo" data-path="src/pages/Dashboard.tsx">
                <Clock className="h-6 w-6" data-id="cz8jva6n3" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="fjjhv4s9f" data-path="src/pages/Dashboard.tsx">View Timesheet</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default Dashboard;
=======
  FileText,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Archive,
  CheckSquare,
  CreditCard,
  Bell,
  UserPlus,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getDashboardStats, DashboardStats } from "@/services/dashboard";

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: { total: 0, active: 0, inactive: 0 },
  todayAttendance: { present: 0, absent: 0, late: 0, total: 0 },
  myAttendance: null,
  pendingLeaves: 0,
  myPendingLeaves: 0,
  monthlyPayroll: { amount: 0, currency: "ETB", delta: "0", trend: "up" },
  overdueTasks: 0,
  totalAssets: 0,
  recentActivity: [],
  charts: {
    employeesByDepartment: [],
    payrollTrend: [],
    expensesByType: [],
    assetsByStatus: [],
  },
  widgets: {
    overdueTasks: [],
    pendingExpenses: [],
    assetsNeedingMaintenance: [],
  },
};

const normalizeStats = (raw?: DashboardStats | null): DashboardStats => {
  if (!raw) return DEFAULT_STATS;

  return {
    ...DEFAULT_STATS,
    ...raw,
    totalEmployees: {
      ...DEFAULT_STATS.totalEmployees,
      ...raw.totalEmployees,
    },
    todayAttendance: {
      ...DEFAULT_STATS.todayAttendance,
      ...raw.todayAttendance,
    },
    monthlyPayroll: raw.monthlyPayroll
      ? {
          ...DEFAULT_STATS.monthlyPayroll,
          ...raw.monthlyPayroll,
        }
      : DEFAULT_STATS.monthlyPayroll,
    pendingLeaves: raw.pendingLeaves ?? DEFAULT_STATS.pendingLeaves,
    myPendingLeaves: raw.myPendingLeaves ?? DEFAULT_STATS.myPendingLeaves,
    overdueTasks: raw.overdueTasks ?? DEFAULT_STATS.overdueTasks,
    totalAssets: raw.totalAssets ?? DEFAULT_STATS.totalAssets,
    recentActivity: raw.recentActivity ?? DEFAULT_STATS.recentActivity,
    charts: {
      employeesByDepartment:
        raw.charts?.employeesByDepartment ?? DEFAULT_STATS.charts?.employeesByDepartment,
      payrollTrend: raw.charts?.payrollTrend ?? DEFAULT_STATS.charts?.payrollTrend,
      expensesByType: raw.charts?.expensesByType ?? DEFAULT_STATS.charts?.expensesByType,
      assetsByStatus: raw.charts?.assetsByStatus ?? DEFAULT_STATS.charts?.assetsByStatus,
    },
    widgets: {
      overdueTasks: raw.widgets?.overdueTasks ?? DEFAULT_STATS.widgets?.overdueTasks,
      pendingExpenses: raw.widgets?.pendingExpenses ?? DEFAULT_STATS.widgets?.pendingExpenses,
      assetsNeedingMaintenance:
        raw.widgets?.assetsNeedingMaintenance ??
        DEFAULT_STATS.widgets?.assetsNeedingMaintenance,
    },
  };
};

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());
  const [statsError, setStatsError] = useState<string | null>(null);

  const isAdmin = user?.roles?.some((r) => r.toUpperCase() === "ADMIN") || false;
  const isHR = user?.roles?.some((r) => r.toUpperCase() === "HR") || false;
  const isManager = user?.roles?.some((r) => r.toUpperCase() === "MANAGER") || false;
  const isEmployee = user?.roles?.some((r) => r.toUpperCase() === "EMPLOYEE") || false;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(normalizeStats(response.stats));
      setGeneratedAt(new Date(response.generatedAt));
      setStatsError(null);
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
      setStats(DEFAULT_STATS);
      setStatsError(error?.message ?? "Dashboard data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const toggleWidget = (widgetId: string) => {
    setExpandedWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  };

  const getActivityIcon = (type: string) => {
    switch ((type || "").toLowerCase()) {
      case "leave":
        return <Calendar className="h-4 w-4" />;
      case "expense":
        return <CreditCard className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      case "announcement":
        return <Bell className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "asset":
        return <Archive className="h-4 w-4" />;
      case "employee":
        return <Users className="h-4 w-4" />;
      case "payroll":
        return <DollarSign className="h-4 w-4" />;
      case "attendance":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string | null | undefined) => {
    const normalized = (status || "").toUpperCase();
    switch (normalized) {
      case "APPROVED":
      case "COMPLETED":
      case "PUBLISHED":
      case "ASSIGNED":
        return "bg-green-500";
      case "PENDING":
      case "SUBMITTED":
      case "CREATED":
      case "GENERATED":
        return "bg-blue-500";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

const CHART_COLORS = ["#6366f1", "#22d3ee", "#f97316", "#ec4899", "#10b981", "#8b5cf6", "#facc15"];

const KPI_STYLES = [
  {
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    accent: "text-indigo-100",
    glow: "ring-indigo-200/60",
  },
  {
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    accent: "text-emerald-100",
    glow: "ring-emerald-200/60",
  },
  {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    accent: "text-amber-100",
    glow: "ring-amber-200/60",
  },
  {
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    accent: "text-sky-100",
    glow: "ring-sky-200/60",
  },
  {
    gradient: "from-fuchsia-500 via-purple-600 to-indigo-600",
    accent: "text-fuchsia-100",
    glow: "ring-fuchsia-200/60",
  },
  {
    gradient: "from-slate-600 via-slate-700 to-slate-900",
    accent: "text-slate-100",
    glow: "ring-slate-200/60",
  },
];

  const normalizedStats = useMemo(() => normalizeStats(stats), [stats]);
  const totalEmployees = normalizedStats.totalEmployees ?? DEFAULT_STATS.totalEmployees;
  const todayAttendance = normalizedStats.todayAttendance ?? DEFAULT_STATS.todayAttendance;
  const monthlyPayroll = normalizedStats.monthlyPayroll ?? DEFAULT_STATS.monthlyPayroll;
  const payrollAmount =
    typeof monthlyPayroll.amount === "number" && !Number.isNaN(monthlyPayroll.amount)
      ? monthlyPayroll.amount
      : Number(monthlyPayroll.amount) || 0;
  const payrollDelta = Number(monthlyPayroll.delta ?? 0) || 0;
  const payrollTrend = monthlyPayroll.trend ?? (payrollDelta >= 0 ? "up" : "down");
  const pendingLeaves = normalizedStats.pendingLeaves ?? 0;
  const myPendingLeaves = normalizedStats.myPendingLeaves ?? 0;
  const overdueTasks = normalizedStats.overdueTasks ?? 0;
  const totalAssets = normalizedStats.totalAssets ?? 0;
  const charts = normalizedStats.charts ?? DEFAULT_STATS.charts!;
  const widgets = normalizedStats.widgets ?? DEFAULT_STATS.widgets!;
  const recentActivity = normalizedStats.recentActivity ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(255,255,255,0)_60%)] opacity-80 pointer-events-none" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-sm">
              <TrendingUp className="h-3.5 w-3.5" />
              Overview
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                {getGreeting()}, {user?.firstName}!
              </h1>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-indigo-100/90">
                {isEmployee
                  ? "Here’s a personalized snapshot of your work and upcoming actions."
                  : "Monitor people, processes, and productivity with a real-time organizational overview."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPermission("employees.write") && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => navigate("/employees")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
              {hasPermission("expense.create") && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => navigate("/expenses")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  New Expense
                </Button>
              )}
              {hasPermission("tasks.create") && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => navigate("/tasks")}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              )}
              {hasPermission("announcements.create") && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => navigate("/announcements/create")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Create Announcement
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center xl:items-end">
            <div className="rounded-2xl bg-white/15 px-5 py-4 text-white shadow-xl backdrop-blur-lg">
              <p className="text-xs uppercase tracking-wide text-indigo-100/80">Current Time</p>
              <p className="text-lg font-semibold">{format(new Date(), "EEEE, MMMM dd, yyyy")}</p>
              <p className="text-3xl font-bold">{format(new Date(), "HH:mm")}</p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="flex items-center gap-2 rounded-full bg-white/20 px-5 text-white hover:bg-white/30 backdrop-blur"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
        {statsError && (
          <div className="relative mt-5 rounded-2xl bg-white/12 p-4 text-sm text-red-100 ring-1 ring-white/40 backdrop-blur">
            Dashboard metrics are currently unavailable. Showing fallback values while we retry.
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Employees */}
        {(isAdmin || isHR || isManager) && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[0].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[0].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_65%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Total Employees
              </CardTitle>
              <Users className={`h-5 w-5 ${KPI_STYLES[0].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{totalEmployees.total.toLocaleString()}</div>
              <p className="text-xs text-white/80 mt-2">
                {totalEmployees.active.toLocaleString()} active ·{" "}
                {totalEmployees.inactive.toLocaleString()} inactive
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Attendance */}
        {(isAdmin || isHR || isManager) && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[1].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[1].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.5),_transparent_70%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Today's Attendance
              </CardTitle>
              <Clock className={`h-5 w-5 ${KPI_STYLES[1].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{todayAttendance.present.toLocaleString()}</div>
              <p className="text-xs text-white/80 mt-2">
                {todayAttendance.absent.toLocaleString()} absent ·{" "}
                {todayAttendance.late.toLocaleString()} late
              </p>
              {todayAttendance.total > 0 && (
                <Progress
                  value={(todayAttendance.present / todayAttendance.total) * 100}
                  className="mt-3 h-2 bg-white/30"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Leaves */}
        {(isAdmin || isHR || isManager) && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[2].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[2].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.55),_transparent_70%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Pending Leaves
              </CardTitle>
              <Calendar className={`h-5 w-5 ${KPI_STYLES[2].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{pendingLeaves.toLocaleString()}</div>
              <p className="text-xs text-white/80 mt-2">Awaiting approval</p>
            </CardContent>
          </Card>
        )}

        {/* My Pending Leaves (Employee) */}
        {isEmployee && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[1].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[1].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.55),_transparent_70%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                My Pending Leaves
              </CardTitle>
              <Calendar className={`h-5 w-5 ${KPI_STYLES[1].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{myPendingLeaves.toLocaleString()}</div>
              <p className="text-xs text-white/80 mt-2">Awaiting approval</p>
            </CardContent>
          </Card>
        )}

        {/* Monthly Payroll */}
        {(isAdmin || isHR) && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[3].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[3].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_70%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Monthly Payroll
              </CardTitle>
              <DollarSign className={`h-5 w-5 ${KPI_STYLES[3].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">
                {monthlyPayroll.currency} {payrollAmount.toLocaleString()}
              </div>
              <p
                className={`text-xs flex items-center gap-1 mt-3 ${
                  payrollTrend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {payrollTrend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(payrollDelta).toLocaleString(undefined, { maximumFractionDigits: 1 })}% from last month
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overdue Tasks */}
        <Card
          className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[4].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[4].glow}`}
        >
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.55),_transparent_70%)]" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
              Overdue Tasks
            </CardTitle>
            <CheckSquare className={`h-5 w-5 ${KPI_STYLES[4].accent}`} />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold">{overdueTasks.toLocaleString()}</div>
            <p className="text-xs text-white/80 mt-2">Need attention</p>
          </CardContent>
        </Card>

        {/* Total Assets */}
        {(isAdmin || isHR || isManager) && (
          <Card
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${KPI_STYLES[5].gradient} text-white shadow-xl transition-all hover:shadow-2xl ring-1 ${KPI_STYLES[5].glow}`}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_70%)]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/90">
                Total Assets
              </CardTitle>
              <Archive className={`h-5 w-5 ${KPI_STYLES[5].accent}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{totalAssets.toLocaleString()}</div>
              <p className="text-xs text-white/80 mt-2">In inventory</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activity Feed & Widgets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-col gap-3 rounded-2xl border border-muted/40 bg-background/90 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-lg sm:flex-row sm:items-center"
                      onClick={() => {
                        switch (activity.module) {
                          case "LEAVES":
                            navigate("/leave");
                            break;
                          case "EXPENSES":
                            navigate("/expenses");
                            break;
                          case "TASKS":
                            navigate("/tasks");
                            break;
                          case "ANNOUNCEMENTS":
                            navigate("/announcements");
                            break;
                          case "DOCUMENTS":
                            navigate("/documents");
                            break;
                          case "ASSETS":
                            navigate("/assets");
                            break;
                          case "EMPLOYEES":
                            navigate("/employees");
                            break;
                          case "PAYROLL":
                            navigate("/payroll");
                            break;
                          default:
                            break;
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${getActivityColor(
                            activity.status
                          )} text-white shadow-md`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table Widgets */}
          <div className="space-y-4">
            {/* Overdue Tasks Widget */}
            {widgets.overdueTasks && widgets.overdueTasks.length > 0 && (
              <Card>
                <Collapsible
                  open={expandedWidgets.has("overdue-tasks")}
                  onOpenChange={() => toggleWidget("overdue-tasks")}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Overdue Tasks</CardTitle>
                          <CardDescription>Tasks that are past their due date</CardDescription>
                        </div>
                        {expandedWidgets.has("overdue-tasks") ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Priority</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {widgets.overdueTasks.slice(0, 10).map((task) => (
                            <TableRow
                              key={task.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>{task.assignee}</TableCell>
                              <TableCell>{format(new Date(task.dueDate), "MMM dd, yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{task.priority}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Pending Expenses Widget */}
            {widgets.pendingExpenses &&
              widgets.pendingExpenses.length > 0 &&
              (isAdmin || isHR || isManager) && (
                <Card>
                  <Collapsible
                    open={expandedWidgets.has("pending-expenses")}
                    onOpenChange={() => toggleWidget("pending-expenses")}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Pending Expense Approvals</CardTitle>
                            <CardDescription>Expenses awaiting your approval</CardDescription>
                          </div>
                          {expandedWidgets.has("pending-expenses") ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Expense</TableHead>
                              <TableHead>Submitted By</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {widgets.pendingExpenses.slice(0, 10).map((exp) => (
                              <TableRow
                                key={exp.id}
                                className="cursor-pointer"
                                onClick={() => navigate(`/expenses/${exp.id}`)}
                              >
                                <TableCell className="font-medium">{exp.title}</TableCell>
                                <TableCell>{exp.submittedBy}</TableCell>
                                <TableCell>
                                  {exp.currency} {exp.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>{exp.department || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}

            {/* Assets Needing Maintenance */}
            {widgets.assetsNeedingMaintenance &&
              widgets.assetsNeedingMaintenance.length > 0 &&
              (isAdmin || isHR || isManager) && (
                <Card>
                  <Collapsible
                    open={expandedWidgets.has("assets-maintenance")}
                    onOpenChange={() => toggleWidget("assets-maintenance")}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Assets Needing Maintenance</CardTitle>
                            <CardDescription>Maintenance due in next 30 days</CardDescription>
                          </div>
                          {expandedWidgets.has("assets-maintenance") ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead>Tag</TableHead>
                              <TableHead>Next Maintenance</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {widgets.assetsNeedingMaintenance.slice(0, 10).map((asset) => (
                              <TableRow
                                key={asset.id}
                                className="cursor-pointer"
                                onClick={() => navigate(`/assets/${asset.id}`)}
                              >
                                <TableCell className="font-medium">{asset.name}</TableCell>
                                <TableCell>{asset.assetTag}</TableCell>
                                <TableCell>
                                  {format(new Date(asset.nextMaintenanceDate), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell>{asset.department || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
          </div>
        </div>

        {/* Right Column - Charts & Quick Actions */}
        <div className="space-y-6">
          {/* Charts Section */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Visual insights and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  {charts.employeesByDepartment && charts.employeesByDepartment.length > 0 && (
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                  )}
                  {charts.payrollTrend &&
                    charts.payrollTrend.length > 0 &&
                    (isAdmin || isHR) && (
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  )}
                  {charts.expensesByType && charts.expensesByType.length > 0 && (
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  )}
                  {charts.assetsByStatus && charts.assetsByStatus.length > 0 && (
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                  )}
                </TabsList>

                {charts.employeesByDepartment && charts.employeesByDepartment.length > 0 && (
                  <TabsContent value="employees" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={charts.employeesByDepartment}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {charts.employeesByDepartment.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}

                {charts.payrollTrend && charts.payrollTrend.length > 0 && (isAdmin || isHR) && (
                  <TabsContent value="payroll" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={charts.payrollTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `ETB ${Number(value).toLocaleString()}`} />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="Payroll"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}

                {charts.expensesByType && charts.expensesByType.length > 0 && (
                  <TabsContent value="expenses" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.expensesByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Amount (ETB)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}

                {charts.assetsByStatus && charts.assetsByStatus.length > 0 && (
                  <TabsContent value="assets" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.assetsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasPermission("attendance.mark") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/attendance")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Check In/Out
                </Button>
              )}
              {hasPermission("leave.apply") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/leave")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Apply Leave
                </Button>
              )}
              {hasPermission("expense.create") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/expenses")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Submit Expense
                </Button>
              )}
              {hasPermission("timesheet.create") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/timesheet")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View Timesheet
                </Button>
              )}
              {hasPermission("tasks.view") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/tasks")}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  View Tasks
                </Button>
              )}
              {hasPermission("reports.view") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/reports")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
>>>>>>> dev
