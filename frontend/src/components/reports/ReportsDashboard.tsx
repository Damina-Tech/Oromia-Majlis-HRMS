import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  RefreshCw,
  Plus,
} from "lucide-react";
import { getDashboardWidgets, DashboardWidget, getModuleLabel } from "@/services/reports";
import { toast } from "sonner";

interface ReportsDashboardProps {
  onGenerateReport?: () => void;
}

export default function ReportsDashboard({ onGenerateReport }: ReportsDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      setLoading(true);
      const response = await getDashboardWidgets();
      setWidgets(response.widgets);
    } catch (error: any) {
      console.error("Failed to load widgets:", error);
      toast.error("Failed to load dashboard widgets");
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case "KPI":
        return (
          <Card key={widget.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              {getWidgetIcon(widget.module)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(widget.config.value, widget.config.format)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {getModuleLabel(widget.module)}
              </p>
            </CardContent>
          </Card>
        );
      case "CHART":
        return (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
              <CardDescription>{getModuleLabel(widget.module)}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart(widget)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderChart = (widget: DashboardWidget) => {
    const chartType = widget.config.chartType || "bar";
    const data = widget.config.data || [];

    if (chartType === "pie") {
      const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];
      return (
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      );
    }

    // Default bar chart
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    );
  };

  const getWidgetIcon = (module: string) => {
    const iconClass = "h-4 w-4 text-muted-foreground";
    switch (module) {
      case "EMPLOYEES":
        return <Users className={iconClass} />;
      case "LEAVES":
      case "ATTENDANCE":
        return <Calendar className={iconClass} />;
      case "PAYROLL":
      case "EXPENSES":
        return <DollarSign className={iconClass} />;
      case "TASKS":
        return <Clock className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const formatValue = (value: number, format?: string) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ETB",
      }).format(value);
    }
    if (format === "percentage") {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports Dashboard</h2>
          <p className="text-muted-foreground">
            Key metrics and insights across all modules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWidgets}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {onGenerateReport && (
            <Button onClick={onGenerateReport}>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          )}
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets
          .filter((w) => w.type === "KPI")
          .map((widget) => renderWidget(widget))}
      </div>

      {/* Chart Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets
          .filter((w) => w.type === "CHART")
          .map((widget) => renderWidget(widget))}
      </div>

      {widgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No widgets available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate reports to see dashboard widgets
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

