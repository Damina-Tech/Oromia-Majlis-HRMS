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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Filter,
} from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export default function ReportsPage() {


  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("this-month");
  const [department, setDepartment] = useState("all");
  const [reportType, setReportType] = useState("summary");

  // Mock data for reports
  const attendanceData = [
    { name: "Mon", present: 45, absent: 5, late: 2 },
    { name: "Tue", present: 48, absent: 2, late: 1 },
    { name: "Wed", present: 47, absent: 3, late: 3 },
    { name: "Thu", present: 46, absent: 4, late: 2 },
    { name: "Fri", present: 44, absent: 6, late: 4 },
  ];

  const leaveData = [
    { name: "Annual Leave", value: 65, color: "#8884d8" },
    { name: "Sick Leave", value: 25, color: "#82ca9d" },
    { name: "Personal Leave", value: 15, color: "#ffc658" },
    { name: "Maternity Leave", value: 8, color: "#ff7300" },
  ];

  const payrollData = [
    { month: "Jan", gross: 450000, net: 360000, taxes: 90000 },
    { month: "Feb", gross: 465000, net: 372000, taxes: 93000 },
    { month: "Mar", gross: 478000, net: 382400, taxes: 95600 },
    { month: "Apr", gross: 485000, net: 388000, taxes: 97000 },
    { month: "May", gross: 492000, net: 393600, taxes: 98400 },
    { month: "Jun", gross: 501000, net: 400800, taxes: 100200 },
  ];

  const timesheetData = [
    {
      employee: "John Doe",
      regularHours: 160,
      overtimeHours: 12,
      totalHours: 172,
    },
    {
      employee: "Jane Smith",
      regularHours: 160,
      overtimeHours: 8,
      totalHours: 168,
    },
    {
      employee: "Alice Johnson",
      regularHours: 152,
      overtimeHours: 5,
      totalHours: 157,
    },
    {
      employee: "Bob Wilson",
      regularHours: 160,
      overtimeHours: 15,
      totalHours: 175,
    },
    {
      employee: "Carol Brown",
      regularHours: 158,
      overtimeHours: 3,
      totalHours: 161,
    },
  ];

  const departmentStats = [
    { department: "Engineering", employees: 25, avgSalary: 95000, turnover: 5 },
    { department: "Sales", employees: 15, avgSalary: 75000, turnover: 8 },
    { department: "Marketing", employees: 12, avgSalary: 70000, turnover: 3 },
    { department: "HR", employees: 8, avgSalary: 65000, turnover: 2 },
    { department: "Finance", employees: 10, avgSalary: 80000, turnover: 1 },
  ];

  const handleExportReport = (format: "excel" | "pdf") => {
    // addNotification({
    //   title: "Export Started",
    //   message: `Your ${format.toUpperCase()} report is being generated`,
    //   type: "info",
    // });

    // // Simulate export process
    // setTimeout(() => {
    //   addNotification({
    //     title: "Export Complete",
    //     message: `Your ${format.toUpperCase()} report has been downloaded`,
    //     type: "success",
    //   });
    // }, 2000);
  };

  const getDateRangeText = () => {
    const now = new Date();
    switch (dateRange) {
      case "this-week":
        return `${format(startOfWeek(now), "MMM dd")} - ${format(
          endOfWeek(now),
          "MMM dd, yyyy"
        )}`;
      case "this-month":
        return `${format(startOfMonth(now), "MMM dd")} - ${format(
          endOfMonth(now),
          "MMM dd, yyyy"
        )}`;
      case "last-30-days":
        return `${format(subDays(now, 30), "MMM dd")} - ${format(
          now,
          "MMM dd, yyyy"
        )}`;
      case "last-90-days":
        return `${format(subDays(now, 90), "MMM dd")} - ${format(
          now,
          "MMM dd, yyyy"
        )}`;
      default:
        return "Custom Range";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive reports and insights for HR operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport("excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground mt-1">
                {getDateRangeText()}
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comparative">Comparative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">
                  +5 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Attendance Rate
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Payroll
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$501K</div>
                <p className="text-xs text-muted-foreground">
                  +3.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Hours/Week
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42.3</div>
                <p className="text-xs text-muted-foreground">
                  +0.8 from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>
                Employee distribution and key metrics by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Avg. Salary</TableHead>
                    <TableHead>Turnover Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell className="font-medium">
                        {dept.department}
                      </TableCell>
                      <TableCell>{dept.employees}</TableCell>
                      <TableCell>${dept.avgSalary.toLocaleString()}</TableCell>
                      <TableCell>{dept.turnover}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
                <CardDescription>
                  Attendance patterns for the current week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#10b981" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>Key attendance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Present</span>
                  <span className="text-sm font-bold text-green-600">
                    230 (94.2%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Absent</span>
                  <span className="text-sm font-bold text-red-600">
                    12 (4.9%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Late</span>
                  <span className="text-sm font-bold text-yellow-600">
                    8 (3.3%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">On Leave</span>
                  <span className="text-sm font-bold text-blue-600">
                    5 (2.0%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Distribution</CardTitle>
                <CardDescription>
                  Types of leaves taken this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Statistics</CardTitle>
                <CardDescription>Monthly leave summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaveData.map((leave) => (
                  <div
                    key={leave.name}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: leave.color }}
                      />
                      <span className="text-sm font-medium">{leave.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {leave.value} days
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Total Leave Days
                    </span>
                    <span className="text-sm font-bold">
                      {leaveData.reduce(
                        (total, leave) => total + leave.value,
                        0
                      )}{" "}
                      days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Trends</CardTitle>
              <CardDescription>
                Monthly payroll expenses over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="gross"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Gross Pay"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Net Pay"
                  />
                  <Line
                    type="monotone"
                    dataKey="taxes"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="Taxes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Hours Summary</CardTitle>
              <CardDescription>
                Hours worked by employees this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheetData.map((employee) => (
                    <TableRow key={employee.employee}>
                      <TableCell className="font-medium">
                        {employee.employee}
                      </TableCell>
                      <TableCell>{employee.regularHours}h</TableCell>
                      <TableCell>{employee.overtimeHours}h</TableCell>
                      <TableCell className="font-bold">
                        {employee.totalHours}h
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(employee.totalHours / 180) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round((employee.totalHours / 180) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
