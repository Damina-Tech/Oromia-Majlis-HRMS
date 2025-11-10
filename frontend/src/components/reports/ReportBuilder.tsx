import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Play,
  X,
  Plus,
  Trash2,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Archive,
  CreditCard,
  Folder,
  Timer,
  Building2,
} from "lucide-react";
import {
  generateReport,
  getReportTemplates,
  GenerateReportDto,
  ReportFilter,
  ReportTemplate,
  getModuleLabel,
  getReportTypeLabel,
} from "@/services/reports";
import { toast } from "sonner";
import { listDepartments } from "@/services/departments";
import { listEmployees } from "@/services/employees";

const MODULES = [
  { value: "EMPLOYEES", label: "Employees", icon: Users },
  { value: "DEPARTMENTS", label: "Departments", icon: Building2 },
  { value: "LEAVES", label: "Leaves", icon: Calendar },
  { value: "ATTENDANCE", label: "Attendance", icon: Clock },
  { value: "PAYROLL", label: "Payroll", icon: DollarSign },
  { value: "TASKS", label: "Tasks", icon: Clock },
  { value: "ASSETS", label: "Assets", icon: Archive },
  { value: "EXPENSES", label: "Expenses", icon: CreditCard },
  { value: "DOCUMENTS", label: "Documents", icon: Folder },
  { value: "TIMESHEETS", label: "Timesheets", icon: Timer },
];

const REPORT_TYPES = [
  { value: "SUMMARY", label: "Summary" },
  { value: "DETAILED", label: "Detailed" },
  { value: "COMPARATIVE", label: "Comparative" },
  { value: "TREND", label: "Trend" },
  { value: "DISTRIBUTION", label: "Distribution" },
];

const VISUALIZATION_TYPES = [
  { value: "TABLE", label: "Table" },
  { value: "BAR_CHART", label: "Bar Chart" },
  { value: "LINE_CHART", label: "Line Chart" },
  { value: "PIE_CHART", label: "Pie Chart" },
  { value: "HEATMAP", label: "Heatmap" },
];

const DATE_RANGES = [
  { value: "TODAY", label: "Today" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_30_DAYS", label: "Last 30 Days" },
  { value: "LAST_90_DAYS", label: "Last 90 Days" },
  { value: "THIS_YEAR", label: "This Year" },
  { value: "CUSTOM", label: "Custom Range" },
];

interface ReportBuilderProps {
  onReportGenerated?: (reportData: any) => void;
}

export default function ReportBuilder({ onReportGenerated }: ReportBuilderProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get("templateId");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);

  // Form state
  const [module, setModule] = useState<GenerateReportDto["module"]>("EMPLOYEES");
  const [reportType, setReportType] = useState<GenerateReportDto["reportType"]>("SUMMARY");
  const [visualization, setVisualization] = useState<GenerateReportDto["visualization"]>("TABLE");
  const [dateRange, setDateRange] = useState<ReportFilter["dateRange"]>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    loadInitialData();
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadInitialData = async () => {
    try {
      const [deptsData, empsData] = await Promise.all([
        listDepartments(),
        listEmployees({ page: 1, pageSize: 1000 }),
      ]);
      setDepartments(deptsData.items || []);
      setEmployees(empsData.items || []);
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const response = await getReportTemplates();
      const found = response.items.find((t) => t.id === id);
      if (found) {
        setTemplate(found);
        setModule(found.module as any);
        setReportType(found.reportType as any);
        setVisualization(found.defaultVisualization as any);
        if (found.defaultFilters) {
          setDateRange(found.defaultFilters.dateRange || "THIS_MONTH");
          setStartDate(found.defaultFilters.startDate || "");
          setEndDate(found.defaultFilters.endDate || "");
          setSelectedDepartments(found.defaultFilters.departmentIds || []);
          setSelectedEmployees(found.defaultFilters.employeeIds || []);
          setStatus(found.defaultFilters.status || "");
        }
      }
    } catch (error: any) {
      console.error("Failed to load template:", error);
      toast.error("Failed to load template");
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const filters: ReportFilter = {
        dateRange,
        ...(dateRange === "CUSTOM" && { startDate, endDate }),
        ...(selectedDepartments.length > 0 && { departmentIds: selectedDepartments }),
        ...(selectedEmployees.length > 0 && { employeeIds: selectedEmployees }),
        ...(status && { status }),
      };

      const dto: GenerateReportDto = {
        templateId: template?.id,
        module,
        reportType,
        filters,
        visualization,
        saveAsTemplate,
        ...(saveAsTemplate && templateName && { templateName }),
      };

      const reportData = await generateReport(dto);
      toast.success("Report generated successfully");

      if (onReportGenerated) {
        onReportGenerated(reportData);
      } else {
        // Navigate to report viewer
        navigate(`/reports/view?module=${module}&type=${reportType}`, {
          state: { reportData },
        });
      }
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast.error(error.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  };

  const ModuleIcon = MODULES.find((m) => m.value === module)?.icon || Users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Report Builder</h2>
            <p className="text-muted-foreground">
              Create custom reports with filters, columns, and visualizations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={loading}
          >
            <Play className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Set up your report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Module</Label>
                  <Select value={module} onValueChange={(v) => setModule(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map((mod) => (
                        <SelectItem key={mod.value} value={mod.value}>
                          <div className="flex items-center gap-2">
                            <mod.icon className="h-4 w-4" />
                            {mod.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Visualization</Label>
                <Select
                  value={visualization}
                  onValueChange={(v) => setVisualization(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUALIZATION_TYPES.map((viz) => (
                      <SelectItem key={viz.value} value={viz.value}>
                        {viz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {template && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Using Template</p>
                      <p className="text-xs text-muted-foreground">{template.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTemplate(null);
                        navigate("/reports/builder");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Narrow down your report data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date Range</Label>
                  <Select
                    value={dateRange || "THIS_MONTH"}
                    onValueChange={(v) => setDateRange(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {dateRange === "CUSTOM" && (
                  <>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label>Departments</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments available</p>
                  ) : (
                    departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={selectedDepartments.includes(dept.id)}
                          onCheckedChange={() => toggleDepartment(dept.id)}
                        />
                        <label
                          htmlFor={`dept-${dept.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDepartments.map((deptId) => {
                      const dept = departments.find((d) => d.id === deptId);
                      return (
                        <Badge
                          key={deptId}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleDepartment(deptId)}
                        >
                          {dept?.name}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Employees</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No employees available</p>
                  ) : (
                    employees.map((emp) => (
                      <div key={emp.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`emp-${emp.id}`}
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => toggleEmployee(emp.id)}
                        />
                        <label
                          htmlFor={`emp-${emp.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {emp.firstName} {emp.lastName}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEmployees.map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      return (
                        <Badge
                          key={empId}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleEmployee(empId)}
                        >
                          {emp?.firstName} {emp?.lastName}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Input
                  placeholder="Filter by status (optional)"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save as Template */}
          <Card>
            <CardHeader>
              <CardTitle>Save as Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-template"
                  checked={saveAsTemplate}
                  onCheckedChange={(checked) => setSaveAsTemplate(checked as boolean)}
                />
                <label
                  htmlFor="save-template"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Save this configuration as a template
                </label>
              </div>
              {saveAsTemplate && (
                <div>
                  <Label>Template Name</Label>
                  <Input
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setDateRange("THIS_MONTH");
                  setSelectedDepartments([]);
                  setSelectedEmployees([]);
                  setStatus("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

