import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  listPayrollRuns,
  createPayrollRun,
  updatePayrollRun,
  reviewPayrollRun,
  approvePayrollRun,
  processPayrollRun,
  deletePayrollRun,
  exportBankFile,
  getPayrollRun,
  type PayrollRun,
  type PayrollRunStatus,
  type PayrollPeriodType,
} from "@/services/payroll-runs";
import { listEmployees } from "@/services/employees";
import { listDepartments } from "@/services/departments";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  Loader2,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

const PayrollRunsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canProcess = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [runToDelete, setRunToDelete] = useState<PayrollRun | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodTypeFilter, setPeriodTypeFilter] = useState<string>("all");

  const [createForm, setCreateForm] = useState({
    periodType: "MONTHLY" as PayrollPeriodType,
    periodStart: "",
    periodEnd: "",
    paymentDate: "",
    employeeIds: [] as string[],
    departmentId: "",
  });

  useEffect(() => {
    loadData();
    loadEmployeesAndDepartments();
  }, [page, statusFilter, periodTypeFilter]);

  const loadEmployeesAndDepartments = async () => {
    try {
      const [emps, depts] = await Promise.all([
        listEmployees({ page: 1, pageSize: 1000 }),
        listDepartments(),
      ]);
      setEmployees(emps.items || []);
      setDepartments(depts || []);
    } catch (error: any) {
      console.error("Failed to load employees/departments:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter !== "all") params.status = statusFilter;
      if (periodTypeFilter !== "all") params.periodType = periodTypeFilter;

      const data = await listPayrollRuns(params);
      setPayrollRuns(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayrollRun = async () => {
    if (!createForm.periodStart || !createForm.periodEnd) {
      toast.error("Please select period start and end dates");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        periodType: createForm.periodType,
        periodStart: createForm.periodStart,
        periodEnd: createForm.periodEnd,
      };
      if (createForm.paymentDate) payload.paymentDate = createForm.paymentDate;
      if (createForm.employeeIds.length > 0) payload.employeeIds = createForm.employeeIds;
      if (createForm.departmentId) payload.departmentId = createForm.departmentId;

      await createPayrollRun(payload);
      toast.success("Payroll run created successfully");
      setShowCreateDialog(false);
      setCreateForm({
        periodType: "MONTHLY",
        periodStart: "",
        periodEnd: "",
        paymentDate: "",
        employeeIds: [],
        departmentId: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create payroll run");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRun = async (id: string) => {
    try {
      const run = await getPayrollRun(id);
      setSelectedRun(run);
      setShowViewDialog(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load payroll run");
    }
  };

  const handleStatusChange = async (id: string, action: "review" | "approve" | "process", comments?: string) => {
    try {
      setSubmitting(true);
      if (action === "review") {
        await reviewPayrollRun(id, comments);
      } else if (action === "approve") {
        await approvePayrollRun(id, comments);
      } else if (action === "process") {
        await processPayrollRun(id, comments);
      }
      toast.success(`Payroll run ${action === "review" ? "sent for review" : action === "approve" ? "approved" : "processed"} successfully`);
      loadData();
      if (selectedRun?.id === id) {
        const updated = await getPayrollRun(id);
        setSelectedRun(updated);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} payroll run`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportBankFile = async (id: string, format: "csv" | "txt" = "csv") => {
    try {
      await exportBankFile(id, format);
      toast.success(`Bank export file downloaded (${format.toUpperCase()})`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to export bank file");
    }
  };

  const handleDeleteRun = async () => {
    if (!runToDelete) return;
    try {
      await deletePayrollRun(runToDelete.id);
      toast.success("Payroll run deleted successfully");
      setShowDeleteDialog(false);
      setRunToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete payroll run");
    }
  };

  const getStatusColor = (status: PayrollRunStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSED":
        return "bg-green-100 text-green-800";
      case "PAID":
        return "bg-emerald-100 text-emerald-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert>
          <AlertDescription>
            You don't have permission to view payroll information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Runs</h1>
          <p className="text-gray-600 mt-1">Manage payroll processing cycles</p>
        </div>
        {canProcess && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payroll Run
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodTypeFilter} onValueChange={setPeriodTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Period Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Period Types</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
          <CardDescription>All payroll processing cycles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Total Gross</TableHead>
                <TableHead>Total Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No payroll runs found
                  </TableCell>
                </TableRow>
              ) : (
                payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(run.periodStart), "MMM dd, yyyy")}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {format(new Date(run.periodEnd), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.periodType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {run.employeeCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        ETB {run.totalGross.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ETB {run.totalNet.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {run.paymentDate
                        ? format(new Date(run.paymentDate), "MMM dd, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRun(run.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canProcess && (
                          <>
                            {run.status === "APPROVED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(run.id, "process")}
                                disabled={submitting}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {run.status === "REVIEW" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(run.id, "approve")}
                                disabled={submitting}
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {(run.status === "PROCESSED" || run.status === "APPROVED") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportBankFile(run.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {run.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRunToDelete(run);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payroll Run Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payroll Run</DialogTitle>
            <DialogDescription>
              Create a new payroll run for the specified period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodType">Period Type *</Label>
                <Select
                  value={createForm.periodType}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, periodType: v as PayrollPeriodType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={createForm.paymentDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, paymentDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={createForm.periodStart}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, periodStart: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={createForm.periodEnd}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, periodEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department (Optional)</Label>
                <Select
                  value={createForm.departmentId}
                  onValueChange={(v) => setCreateForm({ ...createForm, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayrollRun} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payroll Run Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Run Details</DialogTitle>
            <DialogDescription>
              Complete information for this payroll run
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Gross</div>
                    <div className="text-2xl font-bold">ETB {selectedRun.totalGross.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Deductions</div>
                    <div className="text-2xl font-bold">ETB {selectedRun.totalDeductions.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Net</div>
                    <div className="text-2xl font-bold text-green-600">
                      ETB {selectedRun.totalNet.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Employees</div>
                    <div className="text-2xl font-bold">{selectedRun.employeeCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Period Info */}
              <div>
                <h4 className="font-semibold mb-2">Period Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Period Type:</span>{" "}
                    <span className="font-medium">{selectedRun.periodType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Start Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(selectedRun.periodStart), "PPP")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">End Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(selectedRun.periodEnd), "PPP")}
                    </span>
                  </div>
                  {selectedRun.paymentDate && (
                    <div>
                      <span className="text-gray-600">Payment Date:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(selectedRun.paymentDate), "PPP")}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Status:</span>{" "}
                    <Badge className={getStatusColor(selectedRun.status)}>
                      {selectedRun.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Approval Timeline */}
              {(selectedRun.reviewedAt || selectedRun.approvedAt || selectedRun.processedAt) && (
                <div>
                  <h4 className="font-semibold mb-2">Approval Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {selectedRun.reviewedAt && (
                      <div>
                        <span className="text-gray-600">Reviewed:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(selectedRun.reviewedAt), "PPP p")}
                        </span>
                      </div>
                    )}
                    {selectedRun.approvedAt && (
                      <div>
                        <span className="text-gray-600">Approved:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(selectedRun.approvedAt), "PPP p")}
                        </span>
                      </div>
                    )}
                    {selectedRun.processedAt && (
                      <div>
                        <span className="text-gray-600">Processed:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(selectedRun.processedAt), "PPP p")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {canProcess && (
                <div className="flex gap-2">
                  {selectedRun.status === "REVIEW" && (
                    <Button
                      onClick={() => handleStatusChange(selectedRun.id, "approve")}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {selectedRun.status === "APPROVED" && (
                    <Button
                      onClick={() => handleStatusChange(selectedRun.id, "process")}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process
                    </Button>
                  )}
                  {(selectedRun.status === "PROCESSED" || selectedRun.status === "APPROVED") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleExportBankFile(selectedRun.id, "csv")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExportBankFile(selectedRun.id, "txt")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export TXT
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Payroll Items Link */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(`/payroll/runs/${selectedRun.id}/items`);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Payroll Items ({selectedRun.items?.length || 0})
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payroll Run</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payroll run? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {runToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Period:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(runToDelete.periodStart), "MMM dd")} -{" "}
                    {format(new Date(runToDelete.periodEnd), "MMM dd, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>{" "}
                  <Badge className={getStatusColor(runToDelete.status)}>
                    {runToDelete.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRun}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollRunsPage;

