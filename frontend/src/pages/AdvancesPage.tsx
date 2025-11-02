import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  listAdvances,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  approveAdvance,
  addAdvanceRepayment,
  type Advance,
  type AdvanceStatus,
} from "@/services/advances";
import { listEmployees } from "@/services/employees";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  DollarSign,
  Loader2,
  Eye,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

const AdvancesPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  const [advanceForm, setAdvanceForm] = useState({
    employeeId: "",
    requestedAmount: "",
    monthlyDeduction: "",
    requestDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [repaymentForm, setRepaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    loadData();
    loadEmployees();
  }, [statusFilter]);

  const loadEmployees = async () => {
    try {
      const data = await listEmployees({ page: 1, pageSize: 1000 });
      setEmployees(data.items || []);
    } catch (error: any) {
      console.error("Failed to load employees:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, pageSize: 1000 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (!canManage && user?.employeeId) params.employeeId = user.employeeId;

      const data = await listAdvances(params);
      setAdvances(data.items);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load advances");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvance = async () => {
    if (!advanceForm.employeeId || !advanceForm.requestedAmount || !advanceForm.monthlyDeduction || !advanceForm.requestDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedAdvance) {
        await updateAdvance(selectedAdvance.id, {
          monthlyDeduction: Number(advanceForm.monthlyDeduction),
          reason: advanceForm.reason,
        });
        toast.success("Advance updated successfully");
      } else {
        await createAdvance({
          employeeId: advanceForm.employeeId,
          requestedAmount: Number(advanceForm.requestedAmount),
          monthlyDeduction: Number(advanceForm.monthlyDeduction),
          requestDate: advanceForm.requestDate,
          reason: advanceForm.reason,
        });
        toast.success("Advance created successfully");
      }
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save advance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAdvance = async (id: string) => {
    if (!user?.id) {
      toast.error("User information not available");
      return;
    }

    try {
      setSubmitting(true);
      await approveAdvance(id, { approvedBy: user.id });
      toast.success("Advance approved successfully");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to approve advance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRepayment = async () => {
    if (!selectedAdvance || !repaymentForm.amount || !repaymentForm.paymentDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await addAdvanceRepayment(selectedAdvance.id, {
        amount: Number(repaymentForm.amount),
        paymentDate: repaymentForm.paymentDate,
        notes: repaymentForm.notes,
      });
      toast.success("Repayment added successfully");
      setShowRepaymentDialog(false);
      setRepaymentForm({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add repayment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdvance = async () => {
    if (!selectedAdvance) return;
    try {
      await deleteAdvance(selectedAdvance.id);
      toast.success("Advance deleted successfully");
      setShowDeleteDialog(false);
      setSelectedAdvance(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete advance");
    }
  };

  const getStatusColor = (status: AdvanceStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "REPAID":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetForm = () => {
    setAdvanceForm({
      employeeId: "",
      requestedAmount: "",
      monthlyDeduction: "",
      requestDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setSelectedAdvance(null);
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">You don't have permission to view advances.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Advances</h1>
          <p className="text-gray-600 mt-1">Manage employee salary advances and repayments</p>
        </div>
        {canManage && (
          <Button onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Advance
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REPAID">Repaid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Advances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Advances</CardTitle>
          <CardDescription>Employee advance records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Requested Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Monthly Deduction</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : advances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No advances found
                  </TableCell>
                </TableRow>
              ) : (
                advances.map((advance) => (
                  <TableRow key={advance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {advance.employee.firstName} {advance.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{advance.employee.employeeCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        ETB {advance.requestedAmount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">ETB {advance.remainingAmount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>ETB {advance.monthlyDeduction.toLocaleString()}</TableCell>
                    <TableCell>
                      {format(new Date(advance.requestDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(advance.status)}>{advance.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAdvance(advance);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && advance.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveAdvance(advance.id)}
                            disabled={submitting}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {canManage && advance.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAdvance(advance);
                              setRepaymentForm({
                                amount: advance.monthlyDeduction.toString(),
                                paymentDate: new Date().toISOString().split("T")[0],
                                notes: "",
                              });
                              setShowRepaymentDialog(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {canManage && advance.status !== "REPAID" && advance.status !== "CANCELLED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAdvance(advance);
                                setAdvanceForm({
                                  employeeId: advance.employeeId,
                                  requestedAmount: advance.requestedAmount.toString(),
                                  monthlyDeduction: advance.monthlyDeduction.toString(),
                                  requestDate: advance.requestDate.split("T")[0],
                                  reason: advance.reason || "",
                                });
                                setShowCreateDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAdvance(advance);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Advance Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAdvance ? "Edit" : "Create"} Advance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advanceEmployeeId">Employee *</Label>
              <Select
                value={advanceForm.employeeId}
                onValueChange={(v) => setAdvanceForm({ ...advanceForm, employeeId: v })}
                disabled={!!selectedAdvance}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedAmount">Requested Amount (ETB) *</Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  step="0.01"
                  value={advanceForm.requestedAmount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, requestedAmount: e.target.value })}
                  disabled={!!selectedAdvance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyDeduction">Monthly Deduction (ETB) *</Label>
                <Input
                  id="monthlyDeduction"
                  type="number"
                  step="0.01"
                  value={advanceForm.monthlyDeduction}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, monthlyDeduction: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestDate">Request Date *</Label>
              <Input
                id="requestDate"
                type="date"
                value={advanceForm.requestDate}
                onChange={(e) => setAdvanceForm({ ...advanceForm, requestDate: e.target.value })}
                disabled={!!selectedAdvance}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                placeholder="Optional reason for advance"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdvance} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedAdvance ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Advance Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advance Details</DialogTitle>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Employee:</span>{" "}
                    <span className="font-medium">
                      {selectedAdvance.employee.firstName} {selectedAdvance.employee.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee Code:</span>{" "}
                    <span className="font-medium">{selectedAdvance.employee.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requested Amount:</span>{" "}
                    <span className="font-medium">ETB {selectedAdvance.requestedAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining:</span>{" "}
                    <span className="font-medium text-red-600">
                      ETB {selectedAdvance.remainingAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Deduction:</span>{" "}
                    <span className="font-medium">ETB {selectedAdvance.monthlyDeduction.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>{" "}
                    <Badge className={getStatusColor(selectedAdvance.status)}>
                      {selectedAdvance.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Request Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(selectedAdvance.requestDate), "PPP")}
                    </span>
                  </div>
                  {selectedAdvance.approvalDate && (
                    <div>
                      <span className="text-gray-600">Approval Date:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(selectedAdvance.approvalDate), "PPP")}
                      </span>
                    </div>
                  )}
                  {selectedAdvance.repaidDate && (
                    <div>
                      <span className="text-gray-600">Repaid Date:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(selectedAdvance.repaidDate), "PPP")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedAdvance.reason && (
                <div>
                  <h4 className="font-semibold mb-2">Reason</h4>
                  <p className="text-sm text-gray-600">{selectedAdvance.reason}</p>
                </div>
              )}

              {selectedAdvance.repaymentHistory && selectedAdvance.repaymentHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Repayment History</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAdvance.repaymentHistory.map((repayment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {format(new Date(repayment.paymentDate), "PPP")}
                          </TableCell>
                          <TableCell>ETB {repayment.amount.toLocaleString()}</TableCell>
                          <TableCell>{repayment.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Repayment Dialog */}
      <Dialog open={showRepaymentDialog} onOpenChange={setShowRepaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Advance Repayment</DialogTitle>
            <DialogDescription>
              Record a repayment for {selectedAdvance?.employee.firstName} {selectedAdvance?.employee.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repaymentAmount">Amount (ETB) *</Label>
              <Input
                id="repaymentAmount"
                type="number"
                step="0.01"
                value={repaymentForm.amount}
                onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repaymentDate">Payment Date *</Label>
              <Input
                id="repaymentDate"
                type="date"
                value={repaymentForm.paymentDate}
                onChange={(e) => setRepaymentForm({ ...repaymentForm, paymentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repaymentNotes">Notes</Label>
              <Textarea
                id="repaymentNotes"
                value={repaymentForm.notes}
                onChange={(e) => setRepaymentForm({ ...repaymentForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRepaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRepayment} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Repayment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this advance? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdvance}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancesPage;

