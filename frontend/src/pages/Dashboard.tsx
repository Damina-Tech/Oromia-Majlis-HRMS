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
