import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  File,
  Search,
  Filter,
  Eye,
  Calendar,
} from "lucide-react";
import {
  ReportData,
  exportReport,
  getModuleLabel,
  getReportTypeLabel,
} from "@/services/reports";
import { toast } from "sonner";
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
import { format } from "date-fns";

interface ReportViewerProps {
  reportData?: ReportData;
}

export default function ReportViewer({ reportData: propReportData }: ReportViewerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const module = searchParams.get("module") || "";
  const type = searchParams.get("type") || "";

  const [reportData, setReportData] = useState<ReportData | null>(
    propReportData || (location.state?.reportData as ReportData) || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!reportData && location.state?.reportData) {
      setReportData(location.state.reportData);
    }
  }, [location.state, reportData]);

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No report data available</p>
          <Button onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  // Try to get visualization from metadata or default to TABLE
  const visualization = (reportData.metadata as any)?.visualization || "TABLE";
  const data = reportData.data || [];
  const metadata = reportData.metadata || {};

  // Filter data based on search
  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Get column names from first row
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleExport = async (format: "EXCEL" | "PDF" | "CSV") => {
    try {
      if (format === "CSV") {
        await exportReport(reportData, format, `report-${module}-${Date.now()}.csv`);
        toast.success("Report exported as CSV");
      } else {
        toast.info(`${format} export coming soon`);
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Report link copied to clipboard");
  };

  const handleDrillDown = (row: any) => {
    // Navigate to detail page or open modal with row details
    toast.info("Drill-down feature coming soon");
  };

  const renderVisualization = () => {
    if (visualization === "TABLE" || !visualization) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search report data..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(
                            new Set(paginatedData.map((_, i) => (currentPage - 1) * pageSize + i))
                          );
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  {columns.map((col) => (
                    <TableHead key={col} className="capitalize">
                      {col.replace(/([A-Z])/g, " $1").trim()}
                    </TableHead>
                  ))}
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} className="text-center py-8">
                      <p className="text-muted-foreground">No data found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => {
                    const globalIndex = (currentPage - 1) * pageSize + index;
                    return (
                      <TableRow key={globalIndex}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(globalIndex)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(globalIndex);
                              } else {
                                newSelected.delete(globalIndex);
                              }
                              setSelectedRows(newSelected);
                            }}
                          />
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col} className="max-w-xs truncate">
                            {formatCellValue(row[col])}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDrillDown(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
                {filteredData.length} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Chart visualizations
    if (visualization === "BAR_CHART" || visualization === "LINE_CHART" || visualization === "PIE_CHART") {
      const chartData = prepareChartData(data, columns);
      
      if (visualization === "PIE_CHART") {
        const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#0088fe"];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      if (visualization === "LINE_CHART") {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      // Bar chart
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return <div>Unsupported visualization type: {visualization}</div>;
  };

  const prepareChartData = (data: any[], columns: string[]) => {
    // Simple aggregation - count by first categorical column
    const categoryCol = columns.find((col) => {
      const sample = data[0]?.[col];
      return typeof sample === "string" || typeof sample === "number";
    }) || columns[0];

    const grouped: Record<string, number> = {};
    data.forEach((row) => {
      const key = String(row[categoryCol] || "Unknown");
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && value.includes("T") && value.includes("Z")) {
      try {
        return format(new Date(value), "MMM dd, yyyy");
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {getModuleLabel(module)} Report
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{getReportTypeLabel(type)}</Badge>
              {metadata.generatedAt && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Generated: {format(new Date(metadata.generatedAt), "MMM dd, yyyy HH:mm")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("CSV")}
          >
            <File className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("EXCEL")}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("PDF")}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Report Metadata */}
      {metadata.totalRows !== undefined && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span>
                  <strong>Total Rows:</strong> {metadata.totalRows.toLocaleString()}
                </span>
                {metadata.filters && (
                  <span className="text-muted-foreground">
                    Filters applied: {Object.keys(metadata.filters).length}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
          <CardDescription>
            {visualization !== "TABLE" && "Interactive visualization of report data"}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderVisualization()}</CardContent>
      </Card>
    </div>
  );
}

