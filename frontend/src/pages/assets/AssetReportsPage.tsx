import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  listAssets,
  listAssetMaintenance,
  listAssetDisposals,
  listAssetDepreciation,
  getAssetStats,
  listAssetCategories,
  listAssetLocations,
  formatCurrency,
  getStatusLabel,
  getConditionLabel,
  type Asset,
  type AssetMaintenance,
  type AssetDisposal,
  type AssetDepreciation,
} from "@/services/assets";
import { listDepartments } from "@/services/departments";
import {
  FileText,
  Download,
  Loader2,
  ArrowLeft,
  Calendar,
  DollarSign,
  Archive,
  Wrench,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AssetReportsPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canView = hasPermission("assets.view");

  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("summary");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [summaryData, setSummaryData] = useState<any>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [disposals, setDisposals] = useState<AssetDisposal[]>([]);
  const [depreciation, setDepreciation] = useState<AssetDepreciation[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (canView) {
      loadFilters();
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      generateReport();
    }
  }, [canView, reportType, dateFrom, dateTo, categoryFilter, locationFilter, departmentFilter]);

  const loadFilters = async () => {
    try {
      const [cats, locs, depts] = await Promise.all([
        listAssetCategories(),
        listAssetLocations(),
        listDepartments(),
      ]);
      setCategories(cats);
      setLocations(locs);
      setDepartments(depts);
    } catch (err: any) {
      console.error("Failed to load filters:", err);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const filters = {
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        locationId: locationFilter !== "all" ? locationFilter : undefined,
        departmentId: departmentFilter !== "all" ? departmentFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      switch (reportType) {
        case "summary":
          const stats = await getAssetStats(filters);
          setSummaryData(stats);
          break;
        case "assets":
          const assetsData = await listAssets({ ...filters, pageSize: 1000 });
          setAssets(assetsData.items);
          break;
        case "maintenance":
          const maintenanceData = await listAssetMaintenance({
            pageSize: 1000,
          });
          setMaintenance(maintenanceData.items.filter((m) => {
            if (filters.dateFrom && new Date(m.date) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(m.date) > new Date(filters.dateTo)) return false;
            return true;
          }));
          break;
        case "disposals":
          const disposalsData = await listAssetDisposals({ pageSize: 1000 });
          setDisposals(disposalsData.items.filter((d) => {
            if (filters.dateFrom && new Date(d.disposalDate) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(d.disposalDate) > new Date(filters.dateTo)) return false;
            return true;
          }));
          break;
        case "depreciation":
          const depreciationData = await listAssetDepreciation({
            pageSize: 1000,
          });
          setDepreciation(depreciationData.items);
          break;
      }
    } catch (err: any) {
      console.error("Failed to generate report:", err);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = "";
    let filename = "";

    switch (reportType) {
      case "summary":
        csvContent = generateSummaryCSV(summaryData);
        filename = "asset-summary-report.csv";
        break;
      case "assets":
        csvContent = generateAssetsCSV(assets);
        filename = "assets-report.csv";
        break;
      case "maintenance":
        csvContent = generateMaintenanceCSV(maintenance);
        filename = "asset-maintenance-report.csv";
        break;
      case "disposals":
        csvContent = generateDisposalsCSV(disposals);
        filename = "asset-disposals-report.csv";
        break;
      case "depreciation":
        csvContent = generateDepreciationCSV(depreciation);
        filename = "asset-depreciation-report.csv";
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully");
  };

  const generateSummaryCSV = (data: any): string => {
    if (!data) return "";
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Assets", data.totalAssets || 0],
      ["Total Value", formatCurrency(data.totalValue || 0)],
      ["Average Value", formatCurrency(data.averageValue || 0)],
      ["Assigned Count", data.assignedCount || 0],
      ["Maintenance Count", data.maintenanceCount || 0],
      ["Disposed Count", data.disposedCount || 0],
    ];
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const generateAssetsCSV = (items: Asset[]): string => {
    const headers = [
      "Asset Code",
      "Name",
      "Category",
      "Brand",
      "Model",
      "Serial Number",
      "Status",
      "Condition",
      "Purchase Price",
      "Purchase Date",
      "Location",
      "Department",
      "Assigned To",
    ];
    const rows = items.map((asset) => [
      asset.assetCode,
      asset.name,
      asset.category?.name || "",
      asset.brand || "",
      asset.model || "",
      asset.serialNumber || "",
      getStatusLabel(asset.status),
      getConditionLabel(asset.condition),
      asset.purchasePrice ? formatCurrency(asset.purchasePrice, asset.currency) : "",
      asset.purchaseDate || "",
      asset.location?.name || "",
      asset.department?.name || "",
      asset.assignedEmployee
        ? `${asset.assignedEmployee.firstName} ${asset.assignedEmployee.lastName}`
        : "",
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  };

  const generateMaintenanceCSV = (items: AssetMaintenance[]): string => {
    const headers = [
      "Date",
      "Asset",
      "Asset Code",
      "Type",
      "Status",
      "Cost",
      "Vendor",
      "Performed By",
      "Next Due Date",
      "Notes",
    ];
    const rows = items.map((item) => [
      format(new Date(item.date), "yyyy-MM-dd"),
      item.asset?.name || "",
      item.asset?.assetCode || "",
      item.type,
      item.status,
      item.cost ? formatCurrency(typeof item.cost === "string" ? parseFloat(item.cost) : item.cost) : "",
      item.vendor?.name || "",
      item.performedByEmployee
        ? `${item.performedByEmployee.firstName} ${item.performedByEmployee.lastName}`
        : "",
      item.nextDueDate ? format(new Date(item.nextDueDate), "yyyy-MM-dd") : "",
      item.notes || "",
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  };

  const generateDisposalsCSV = (items: AssetDisposal[]): string => {
    const headers = [
      "Disposal Date",
      "Asset",
      "Asset Code",
      "Method",
      "Sale Amount",
      "Notes",
      "Approved By",
    ];
    const rows = items.map((item) => [
      format(new Date(item.disposalDate), "yyyy-MM-dd"),
      item.asset?.name || "",
      item.asset?.assetCode || "",
      item.method,
      item.saleAmount ? formatCurrency(typeof item.saleAmount === "string" ? parseFloat(item.saleAmount) : item.saleAmount) : "",
      item.notes || "",
      item.approvedByUser ? `${item.approvedByUser.firstName} ${item.approvedByUser.lastName}` : "",
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  };

  const generateDepreciationCSV = (items: AssetDepreciation[]): string => {
    const headers = [
      "Period",
      "Asset",
      "Asset Code",
      "Depreciation Amount",
      "Accumulated Depreciation",
      "Book Value",
    ];
    const rows = items.map((item) => [
      item.month
        ? format(new Date(item.year, item.month - 1, 1), "MMM yyyy")
        : item.year.toString(),
      item.asset?.name || "",
      item.asset?.assetCode || "",
      formatCurrency(
        typeof item.depreciationAmount === "string"
          ? parseFloat(item.depreciationAmount)
          : item.depreciationAmount
      ),
      formatCurrency(
        typeof item.accumulatedDepr === "string" ? parseFloat(item.accumulatedDepr) : item.accumulatedDepr
      ),
      formatCurrency(typeof item.bookValue === "string" ? parseFloat(item.bookValue) : item.bookValue),
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view asset reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Asset Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export asset management reports</p>
        </div>
        <Button onClick={exportToCSV} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and apply filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="assets">Assets Listing</SelectItem>
                  <SelectItem value="maintenance">Maintenance Report</SelectItem>
                  <SelectItem value="disposals">Disposal Report</SelectItem>
                  <SelectItem value="depreciation">Depreciation Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "summary" && "Summary Report"}
            {reportType === "assets" && "Assets Listing"}
            {reportType === "maintenance" && "Maintenance Report"}
            {reportType === "disposals" && "Disposal Report"}
            {reportType === "depreciation" && "Depreciation Report"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {reportType === "summary" && summaryData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryData.totalAssets}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(summaryData.totalValue)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryData.assignedCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryData.maintenanceCount}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {reportType === "assets" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No assets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-mono">{asset.assetCode}</TableCell>
                          <TableCell>{asset.name}</TableCell>
                          <TableCell>{asset.category?.name || "N/A"}</TableCell>
                          <TableCell>{getStatusLabel(asset.status)}</TableCell>
                          <TableCell>
                            {asset.purchasePrice
                              ? formatCurrency(asset.purchasePrice, asset.currency)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {asset.assignedEmployee
                              ? `${asset.assignedEmployee.firstName} ${asset.assignedEmployee.lastName}`
                              : "Unassigned"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {reportType === "maintenance" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No maintenance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.asset?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {record.asset?.assetCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{record.type}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>
                            {record.cost
                              ? formatCurrency(typeof record.cost === "string" ? parseFloat(record.cost) : record.cost)
                              : "N/A"}
                          </TableCell>
                          <TableCell>{record.vendor?.name || "N/A"}</TableCell>
                          <TableCell>
                            {record.nextDueDate
                              ? format(new Date(record.nextDueDate), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {reportType === "disposals" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disposal Date</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Sale Amount</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No disposal records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      disposals.map((disposal) => (
                        <TableRow key={disposal.id}>
                          <TableCell>
                            {format(new Date(disposal.disposalDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{disposal.asset?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {disposal.asset?.assetCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{disposal.method}</TableCell>
                          <TableCell>
                            {disposal.saleAmount
                              ? formatCurrency(
                                  typeof disposal.saleAmount === "string"
                                    ? parseFloat(disposal.saleAmount)
                                    : disposal.saleAmount
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {disposal.approvedByUser
                              ? `${disposal.approvedByUser.firstName} ${disposal.approvedByUser.lastName}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{disposal.notes || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {reportType === "depreciation" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Depreciation Amount</TableHead>
                      <TableHead>Accumulated</TableHead>
                      <TableHead>Book Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciation.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No depreciation records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      depreciation.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.month
                              ? format(new Date(record.year, record.month - 1, 1), "MMM yyyy")
                              : record.year.toString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.asset?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {record.asset?.assetCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              typeof record.depreciationAmount === "string"
                                ? parseFloat(record.depreciationAmount)
                                : record.depreciationAmount
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              typeof record.accumulatedDepr === "string"
                                ? parseFloat(record.accumulatedDepr)
                                : record.accumulatedDepr
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(
                                typeof record.bookValue === "string"
                                  ? parseFloat(record.bookValue)
                                  : record.bookValue
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
