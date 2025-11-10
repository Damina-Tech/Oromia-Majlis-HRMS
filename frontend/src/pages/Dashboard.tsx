import React, { useState, useEffect } from "react";
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

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());

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
      setStats(response.stats);
      setGeneratedAt(new Date(response.generatedAt));
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
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
    switch (type) {
      case "leave":
        return <Calendar className="h-4 w-4" />;
      case "expense":
        return <CreditCard className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      case "attendance":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "bg-green-500";
      case "PENDING":
      case "SUBMITTED":
        return "bg-yellow-500";
      case "REJECTED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#0088fe", "#ff00ff"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user?.firstName}!
            </h1>
            <p className="text-blue-100">
              {isEmployee
                ? "Here's your personal dashboard overview"
                : "Here's what's happening in your organization today"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-blue-200">{format(new Date(), "EEEE, MMMM dd, yyyy")}</p>
              <p className="text-lg font-semibold">{format(new Date(), "HH:mm")}</p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {hasPermission("employees.write") && (
            <Button
              variant="secondary"
              size="sm"
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
              onClick={() => navigate("/announcements/create")}
            >
              <Bell className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Employees */}
        {(isAdmin || isHR || isManager) && stats?.totalEmployees && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalEmployees.active} active, {stats.totalEmployees.inactive} inactive
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Attendance */}
        {stats?.todayAttendance && (isAdmin || isHR || isManager) && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAttendance.present}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayAttendance.absent} absent, {stats.todayAttendance.late} late
              </p>
              {stats.todayAttendance.total > 0 && (
                <Progress
                  value={(stats.todayAttendance.present / stats.todayAttendance.total) * 100}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Leaves */}
        {stats?.pendingLeaves !== undefined && (isAdmin || isHR || isManager) && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
              <p className="text-xs text-muted-foreground mt-1">require approval</p>
            </CardContent>
          </Card>
        )}

        {/* My Pending Leaves (Employee) */}
        {stats?.myPendingLeaves !== undefined && isEmployee && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Pending Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myPendingLeaves}</div>
              <p className="text-xs text-muted-foreground mt-1">awaiting approval</p>
            </CardContent>
          </Card>
        )}

        {/* Monthly Payroll */}
        {stats?.monthlyPayroll && (isAdmin || isHR) && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthlyPayroll.currency} {stats.monthlyPayroll.amount.toLocaleString()}
              </div>
              <p className={`text-xs flex items-center mt-1 ${
                stats.monthlyPayroll.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {stats.monthlyPayroll.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(Number(stats.monthlyPayroll.delta))}% from last month
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overdue Tasks */}
        {stats?.overdueTasks !== undefined && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">need attention</p>
            </CardContent>
          </Card>
        )}

        {/* Total Assets */}
        {stats?.totalAssets !== undefined && (isAdmin || isHR || isManager) && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">in inventory</p>
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
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        if (activity.module === "LEAVES") navigate("/leave");
                        else if (activity.module === "EXPENSES") navigate("/expenses");
                        else if (activity.module === "TASKS") navigate("/tasks");
                      }}
                    >
                      <div className={`h-2 w-2 rounded-full mt-2 ${getActivityColor(activity.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
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
            {stats?.widgets?.overdueTasks && stats.widgets.overdueTasks.length > 0 && (
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
                          {stats.widgets.overdueTasks.slice(0, 10).map((task) => (
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
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Pending Expenses Widget */}
            {stats?.widgets?.pendingExpenses &&
              stats.widgets.pendingExpenses.length > 0 &&
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
                            {stats.widgets.pendingExpenses.slice(0, 10).map((exp) => (
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
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}

            {/* Assets Needing Maintenance */}
            {stats?.widgets?.assetsNeedingMaintenance &&
              stats.widgets.assetsNeedingMaintenance.length > 0 &&
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
                            {stats.widgets.assetsNeedingMaintenance.slice(0, 10).map((asset) => (
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
                  {stats?.charts?.employeesByDepartment && (
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                  )}
                  {stats?.charts?.payrollTrend && (isAdmin || isHR) && (
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  )}
                  {stats?.charts?.expensesByType && (
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  )}
                  {stats?.charts?.assetsByStatus && (
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                  )}
                </TabsList>

                {stats?.charts?.employeesByDepartment && (
                  <TabsContent value="employees" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.charts.employeesByDepartment}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.charts.employeesByDepartment.map((entry, index) => (
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

                {stats?.charts?.payrollTrend && (isAdmin || isHR) && (
                  <TabsContent value="payroll" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.charts.payrollTrend}>
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

                {stats?.charts?.expensesByType && (
                  <TabsContent value="expenses" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.charts.expensesByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Amount (ETB)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                )}

                {stats?.charts?.assetsByStatus && (
                  <TabsContent value="assets" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.charts.assetsByStatus}>
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
