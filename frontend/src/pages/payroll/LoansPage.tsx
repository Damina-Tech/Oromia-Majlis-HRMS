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
  listLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  approveLoan,
  addLoanRepayment,
  type Loan,
  type LoanStatus,
} from "@/services/loans";
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
  Percent,
} from "lucide-react";
import { format } from "date-fns";

const LoansPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [loanForm, setLoanForm] = useState({
    employeeId: "",
    loanAmount: "",
    interestRate: "",
    monthlyPayment: "",
    startDate: "",
    endDate: "",
    description: "",
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

      const data = await listLoans(params);
      setLoans(data.items);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    if (!loanForm.employeeId || !loanForm.loanAmount || !loanForm.monthlyPayment || !loanForm.startDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedLoan) {
        await updateLoan(selectedLoan.id, {
          interestRate: loanForm.interestRate ? Number(loanForm.interestRate) : undefined,
          monthlyPayment: Number(loanForm.monthlyPayment),
          description: loanForm.description,
        });
        toast.success("Loan updated successfully");
      } else {
        await createLoan({
          employeeId: loanForm.employeeId,
          loanAmount: Number(loanForm.loanAmount),
          interestRate: loanForm.interestRate ? Number(loanForm.interestRate) : 0,
          monthlyPayment: Number(loanForm.monthlyPayment),
          startDate: loanForm.startDate,
          endDate: loanForm.endDate || undefined,
          description: loanForm.description,
        });
        toast.success("Loan created successfully");
      }
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save loan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRepayment = async () => {
    if (!selectedLoan || !repaymentForm.amount || !repaymentForm.paymentDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await addLoanRepayment(selectedLoan.id, {
        amount: Number(repaymentForm.amount),
        paymentDate: repaymentForm.paymentDate,
        notes: repaymentForm.notes,
      });
      toast.success("Repayment added successfully");
      setShowRepaymentDialog(false);
      setRepaymentForm({ amount: "", paymentDate: new Date().toISOString().split("T")[0], notes: "" });
      loadData();
      if (selectedLoan.id) {
        const updated = await listLoans({ page: 1, pageSize: 1 });
        const found = updated.items.find((l: Loan) => l.id === selectedLoan.id);
        if (found) setSelectedLoan(found);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add repayment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;
    try {
      await deleteLoan(selectedLoan.id);
      toast.success("Loan deleted successfully");
      setShowDeleteDialog(false);
      setSelectedLoan(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete loan");
    }
  };

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetForm = () => {
    setLoanForm({
      employeeId: "",
      loanAmount: "",
      interestRate: "",
      monthlyPayment: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    setSelectedLoan(null);
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">You don't have permission to view loans.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Loans</h1>
          <p className="text-gray-600 mt-1">Manage employee loans and repayments</p>
        </div>
        {canManage && (
          <Button onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Loan
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loans</CardTitle>
          <CardDescription>Employee loan records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No loans found
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {loan.employee.firstName} {loan.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{loan.employee.employeeCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        ETB {loan.loanAmount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-gray-400" />
                        {loan.interestRate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">ETB {loan.remainingAmount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>ETB {loan.monthlyPayment.toLocaleString()}</TableCell>
                    <TableCell>
                      {format(new Date(loan.startDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && loan.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRepaymentForm({
                                amount: loan.monthlyPayment.toString(),
                                paymentDate: new Date().toISOString().split("T")[0],
                                notes: "",
                              });
                              setShowRepaymentDialog(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {canManage && loan.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setLoanForm({
                                employeeId: loan.employeeId,
                                loanAmount: loan.loanAmount.toString(),
                                interestRate: loan.interestRate.toString(),
                                monthlyPayment: loan.monthlyPayment.toString(),
                                startDate: loan.startDate.split("T")[0],
                                endDate: loan.endDate ? loan.endDate.split("T")[0] : "",
                                description: loan.description || "",
                              });
                              setShowCreateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canManage && loan.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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

      {/* Create/Edit Loan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLoan ? "Edit" : "Create"} Loan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select
                value={loanForm.employeeId}
                onValueChange={(v) => setLoanForm({ ...loanForm, employeeId: v })}
                disabled={!!selectedLoan}
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
                <Label htmlFor="loanAmount">Loan Amount (ETB) *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  step="0.01"
                  value={loanForm.loanAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })}
                  disabled={!!selectedLoan}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={loanForm.interestRate}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPayment">Monthly Payment (ETB) *</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  step="0.01"
                  value={loanForm.monthlyPayment}
                  onChange={(e) => setLoanForm({ ...loanForm, monthlyPayment: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={loanForm.startDate}
                  onChange={(e) => setLoanForm({ ...loanForm, startDate: e.target.value })}
                  disabled={!!selectedLoan}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={loanForm.endDate}
                onChange={(e) => setLoanForm({ ...loanForm, endDate: e.target.value })}
                disabled={!!selectedLoan}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={loanForm.description}
                onChange={(e) => setLoanForm({ ...loanForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLoan} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedLoan ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Loan Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Employee:</span>{" "}
                    <span className="font-medium">
                      {selectedLoan.employee.firstName} {selectedLoan.employee.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee Code:</span>{" "}
                    <span className="font-medium">{selectedLoan.employee.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Loan Amount:</span>{" "}
                    <span className="font-medium">ETB {selectedLoan.loanAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>{" "}
                    <span className="font-medium">{selectedLoan.interestRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>{" "}
                    <span className="font-medium">ETB {selectedLoan.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining:</span>{" "}
                    <span className="font-medium text-red-600">
                      ETB {selectedLoan.remainingAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Payment:</span>{" "}
                    <span className="font-medium">ETB {selectedLoan.monthlyPayment.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>{" "}
                    <Badge className={getStatusColor(selectedLoan.status)}>
                      {selectedLoan.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Start Date:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(selectedLoan.startDate), "PPP")}
                    </span>
                  </div>
                  {selectedLoan.endDate && (
                    <div>
                      <span className="text-gray-600">End Date:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(selectedLoan.endDate), "PPP")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLoan.repaymentHistory && selectedLoan.repaymentHistory.length > 0 && (
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
                      {selectedLoan.repaymentHistory.map((repayment, idx) => (
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
            <DialogTitle>Add Loan Repayment</DialogTitle>
            <DialogDescription>
              Record a repayment for {selectedLoan?.employee.firstName} {selectedLoan?.employee.lastName}
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
            <DialogTitle>Delete Loan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLoan}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoansPage;

