import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  listPayrollItems,
  updatePayrollItem,
  getPayrollItem,
  generatePayslip,
  downloadPayslip,
  getPayslipData,
  getPayrollRun,
  type PayrollItem,
} from "@/services/payroll-runs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Edit,
  Download,
  FileText,
  Loader2,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

const PayrollRunItemsPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canProcess = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPayslipDialog, setShowPayslipDialog] = useState(false);
  const [payrollRun, setPayrollRun] = useState<any>(null);

  const [editForm, setEditForm] = useState({
    allowances: 0,
    overtime: 0,
    bonus: 0,
    incomeTax: 0,
    otherDeductions: 0,
    notes: "",
  });

  const [payslipData, setPayslipData] = useState<any>(null);

  useEffect(() => {
    if (runId) {
      loadData();
    }
  }, [runId]);

  const loadData = async () => {
    if (!runId) return;
    try {
      setLoading(true);
      const [itemsData, runData] = await Promise.all([
        listPayrollItems({ payrollRunId: runId, pageSize: 1000 }),
        getPayrollRun(runId),
      ]);
      setItems(itemsData.items);
      setPayrollRun(runData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load payroll items");
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = async (id: string) => {
    try {
      const item = await getPayrollItem(id);
      setSelectedItem(item);
      setShowViewDialog(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load payroll item");
    }
  };

  const handleEditItem = (item: PayrollItem) => {
    setSelectedItem(item);
    setEditForm({
      allowances: item.allowances,
      overtime: item.overtime,
      bonus: item.bonus,
      incomeTax: item.incomeTax,
      otherDeductions: item.otherDeductions,
      notes: item.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await updatePayrollItem(selectedItem.id, editForm);
      toast.success("Payroll item updated successfully");
      setShowEditDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update payroll item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePayslip = async (itemId: string) => {
    try {
      setSubmitting(true);
      await generatePayslip(itemId);
      toast.success("Payslip generated successfully");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to generate payslip");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPayslip = async (itemId: string) => {
    try {
      const data = await getPayslipData(itemId);
      setPayslipData(data);
      setShowPayslipDialog(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load payslip data");
    }
  };

  const handleDownloadPayslip = async (itemId: string) => {
    try {
      await downloadPayslip(itemId);
      toast.success("Payslip downloaded successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to download payslip");
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/payroll/runs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Runs
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Items</h1>
          <p className="text-gray-600 mt-1">
            {payrollRun
              ? `Payroll for ${format(new Date(payrollRun.periodStart), "MMM dd")} - ${format(new Date(payrollRun.periodEnd), "MMM dd, yyyy")}`
              : "Individual employee payroll details"}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Gross</div>
              <div className="text-2xl font-bold">
                ETB {items.reduce((sum, item) => sum + item.grossSalary, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Deductions</div>
              <div className="text-2xl font-bold">
                ETB {items.reduce((sum, item) => sum + item.totalDeductions, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Net</div>
              <div className="text-2xl font-bold text-green-600">
                ETB {items.reduce((sum, item) => sum + item.netSalary, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Employees</div>
              <div className="text-2xl font-bold">{items.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Items</CardTitle>
          <CardDescription>Employee payroll details for this run</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Payslip</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No payroll items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.employee.firstName} {item.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{item.employee.employeeCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.employee.department?.name || "—"}</Badge>
                    </TableCell>
                    <TableCell>ETB {item.basicSalary.toLocaleString()}</TableCell>
                    <TableCell>ETB {item.allowances.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">ETB {item.grossSalary.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>ETB {item.totalDeductions.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">
                        ETB {item.netSalary.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.payslipGenerated ? (
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                      ) : (
                        <Badge variant="outline">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewItem(item.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canProcess && (
                          <>
                            {!item.payslipGenerated && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGeneratePayslip(item.id)}
                                disabled={submitting}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            {item.payslipGenerated && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewPayslip(item.id)}
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadPayslip(item.id)}
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
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
        </CardContent>
      </Card>

      {/* View Item Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Item Details</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">
                      {selectedItem.employee.firstName} {selectedItem.employee.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Code:</span>{" "}
                    <span className="font-medium">{selectedItem.employee.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>{" "}
                    <span className="font-medium">
                      {selectedItem.employee.department?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Designation:</span>{" "}
                    <span className="font-medium">{selectedItem.employee.designation || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Earnings</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-medium">ETB {selectedItem.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span className="font-medium">ETB {selectedItem.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span className="font-medium">ETB {selectedItem.overtime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonus:</span>
                    <span className="font-medium">ETB {selectedItem.bonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Gross Salary:</span>
                    <span className="text-green-600">
                      ETB {selectedItem.grossSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Deductions</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span className="font-medium">ETB {selectedItem.incomeTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pension:</span>
                    <span className="font-medium">ETB {selectedItem.pension.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance:</span>
                    <span className="font-medium">
                      ETB {selectedItem.healthInsurance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund:</span>
                    <span className="font-medium">
                      ETB {selectedItem.providentFund.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Deductions:</span>
                    <span className="font-medium">
                      ETB {selectedItem.loanDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Deductions:</span>
                    <span className="font-medium">
                      ETB {selectedItem.advanceDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absence Deductions:</span>
                    <span className="font-medium">
                      ETB {selectedItem.absenceDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium">
                      ETB {selectedItem.otherDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">
                      ETB {selectedItem.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Net Salary:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ETB {selectedItem.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Attendance Summary */}
              <div>
                <h4 className="font-semibold mb-2">Attendance Summary</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-gray-600">Working Days</div>
                    <div className="font-bold">{selectedItem.workingDays}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-gray-600">Present</div>
                    <div className="font-bold text-green-600">{selectedItem.presentDays}</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="text-gray-600">Absent</div>
                    <div className="font-bold text-red-600">{selectedItem.absentDays}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-gray-600">Leave</div>
                    <div className="font-bold text-blue-600">{selectedItem.leaveDays}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {canProcess && selectedItem && (
              <Button onClick={() => handleEditItem(selectedItem)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payroll Item</DialogTitle>
            <DialogDescription>
              Update salary components for {selectedItem?.employee.firstName}{" "}
              {selectedItem?.employee.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances (ETB)</Label>
                <Input
                  id="allowances"
                  type="number"
                  step="0.01"
                  value={editForm.allowances}
                  onChange={(e) =>
                    setEditForm({ ...editForm, allowances: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime (ETB)</Label>
                <Input
                  id="overtime"
                  type="number"
                  step="0.01"
                  value={editForm.overtime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, overtime: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus (ETB)</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  value={editForm.bonus}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bonus: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incomeTax">Income Tax (ETB)</Label>
                <Input
                  id="incomeTax"
                  type="number"
                  step="0.01"
                  value={editForm.incomeTax}
                  onChange={(e) =>
                    setEditForm({ ...editForm, incomeTax: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="otherDeductions">Other Deductions (ETB)</Label>
                <Input
                  id="otherDeductions"
                  type="number"
                  step="0.01"
                  value={editForm.otherDeductions}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      otherDeductions: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip View Dialog */}
      <Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>
              Payslip for {payslipData?.employee.firstName} {payslipData?.employee.lastName}
            </DialogDescription>
          </DialogHeader>

          {payslipData && (
            <div className="space-y-6">
              {/* Employee & Period Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Employee:</span>{" "}
                    <span className="font-medium">
                      {payslipData.employee.firstName} {payslipData.employee.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee Code:</span>{" "}
                    <span className="font-medium">{payslipData.employee.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Period:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(payslipData.payrollRun.periodStart), "MMM dd")} -{" "}
                      {format(new Date(payslipData.payrollRun.periodEnd), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {payslipData.payrollRun.paymentDate && (
                    <div>
                      <span className="text-gray-600">Payment Date:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(payslipData.payrollRun.paymentDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Earnings</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.allowances.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.overtime.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonus:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.bonus.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Gross Salary:</span>
                    <span className="text-green-600">
                      ETB {payslipData.payrollItem.grossSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Deductions</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.incomeTax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pension:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.pension.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.healthInsurance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.providentFund.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Deductions:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.loanDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Deductions:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.advanceDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absence Deductions:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.absenceDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium">
                      ETB {payslipData.payrollItem.otherDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">
                      ETB {payslipData.payrollItem.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Net Salary:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ETB {payslipData.payrollItem.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedItem && selectedItem.payslipGenerated && (
              <Button onClick={() => handleDownloadPayslip(selectedItem.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollRunItemsPage;

