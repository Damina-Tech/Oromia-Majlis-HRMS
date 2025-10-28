import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  listPayroll,
  getPayrollSummary,
  generatePayroll,
  processPayroll,
  updatePayroll,
  deletePayroll,
  PayrollRecord,
  PayrollSummary,
  PayrollStatus,
} from '@/services/payroll';
import { listEmployees } from '@/services/employees';
import { toast } from 'sonner';
import {
  DollarSign,
  Download,
  Eye,
  Calculator,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
} from 'lucide-react';

const PayrollPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedForProcess, setSelectedForProcess] = useState<string[]>([]);

  // Generate payroll form
  const [generateForm, setGenerateForm] = useState({
    periodStart: '',
    periodEnd: '',
  });

  // Edit payroll form
  const [editForm, setEditForm] = useState({
    allowances: 0,
    overtime: 0,
    bonus: 0,
    incomeTax: 0,
    healthInsurance: 0,
    providentFund: 0,
    otherDeductions: 0,
    notes: '',
  });

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<PayrollRecord | null>(null);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const years = ['2024', '2023', '2022'];

  const canProcess = hasPermission('payroll.process');
  const canView = hasPermission('payroll.view');

  // Initialize with current month/year
  useEffect(() => {
    const now = new Date();
    const monthIndex = now.getMonth();
    const year = now.getFullYear().toString();
    setSelectedMonth(months[monthIndex]);
    setSelectedYear(year);
  }, []);

  // Load data when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadData();
    }
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert month name to number
      const monthIndex = months.indexOf(selectedMonth) + 1;
      const monthStr = `${selectedYear}-${monthIndex.toString().padStart(2, '0')}`;

      // Load payroll records and summary
      const [payrollData, summaryData] = await Promise.all([
        listPayroll({ month: monthStr, pageSize: 1000 }),
        getPayrollSummary(monthStr, selectedYear),
      ]);

      setPayrollRecords(payrollData.items);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to load payroll data:', err);
      setError(err.response?.data?.message || 'Failed to load payroll data');
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!generateForm.periodStart || !generateForm.periodEnd) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await generatePayroll({
        periodStart: generateForm.periodStart,
        periodEnd: generateForm.periodEnd,
      });

      toast.success(result.message || 'Payroll generated successfully', {
        duration: 5000,
      });

      setShowGenerateDialog(false);
      setGenerateForm({ periodStart: '', periodEnd: '' });
      loadData();
    } catch (err: any) {
      console.error('Failed to generate payroll:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate payroll';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (selectedForProcess.length === 0) {
      toast.error('Please select payroll records to process');
      return;
    }

    try {
      setSubmitting(true);
      const result = await processPayroll({
        payrollIds: selectedForProcess,
      });

      toast.success(result.message || 'Payroll processed successfully', {
        duration: 5000,
      });

      setSelectedForProcess([]);
      loadData();
    } catch (err: any) {
      console.error('Failed to process payroll:', err);
      toast.error(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPayroll = async () => {
    if (!selectedPayroll) return;

    try {
      setSubmitting(true);
      setError(null);

      // Ensure all numeric fields are properly converted to numbers
      const payrollData = {
        allowances: Number(editForm.allowances) || 0,
        overtime: Number(editForm.overtime) || 0,
        bonus: Number(editForm.bonus) || 0,
        incomeTax: Number(editForm.incomeTax) || 0,
        healthInsurance: Number(editForm.healthInsurance) || 0,
        providentFund: Number(editForm.providentFund) || 0,
        otherDeductions: Number(editForm.otherDeductions) || 0,
        notes: editForm.notes,
      };

      console.log('Sending payroll data:', payrollData);

      await updatePayroll(selectedPayroll.id, payrollData);

      toast.success('Payroll updated successfully', { duration: 5000 });

      setShowEditDialog(false);
      setSelectedPayroll(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to update payroll:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update payroll';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayroll = async () => {
    if (!payrollToDelete) return;

    try {
      await deletePayroll(payrollToDelete.id);
      toast.success('Payroll deleted successfully', { duration: 5000 });
      setShowDeleteDialog(false);
      setPayrollToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete payroll:', err);
      toast.error(err.response?.data?.message || 'Failed to delete payroll');
    }
  };

  const openDeleteDialog = (payroll: PayrollRecord) => {
    setPayrollToDelete(payroll);
    setShowDeleteDialog(true);
  };

  const openEditDialog = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setEditForm({
      allowances: payroll.allowances,
      overtime: payroll.overtime,
      bonus: payroll.bonus,
      incomeTax: payroll.incomeTax,
      healthInsurance: payroll.healthInsurance,
      providentFund: payroll.providentFund,
      otherDeductions: payroll.otherDeductions,
      notes: payroll.notes || '',
    });
    setError(null);
    setShowEditDialog(true);
  };

  const openDetailsDialog = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: PayrollStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const toggleSelectForProcess = (id: string) => {
    setSelectedForProcess((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage employee salaries and payroll processing</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canProcess && (
            <>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate
              </Button>
              {selectedForProcess.length > 0 && (
                <Button onClick={handleProcessPayroll} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  Process ({selectedForProcess.length})
            </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payroll Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                  <p className="text-2xl font-bold">${summary.totalPayroll.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Gross Amount
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Employees</p>
                  <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                  <p className="text-xs text-gray-500">
                    {summary.processed} processed, {summary.paid} paid
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Salary</p>
                  <p className="text-2xl font-bold">${summary.avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-gray-500">per employee</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Payroll</p>
                  <p className="text-2xl font-bold">${summary.netPayroll.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">after deductions</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary Breakdown */}
        {summary && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                Payroll Breakdown - {selectedMonth} {selectedYear}
              </CardTitle>
              <CardDescription>Detailed salary components overview</CardDescription>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {/* Earnings */}
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Basic Salary</span>
                      <span className="font-medium">
                        ${summary.breakdown.basicSalary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Allowances</span>
                      <span className="font-medium">
                        ${summary.breakdown.allowances.toLocaleString()}
                      </span>
                  </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Overtime</span>
                      <span className="font-medium">
                        ${summary.breakdown.overtime.toLocaleString()}
                      </span>
                  </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Bonus</span>
                      <span className="font-medium">
                        ${summary.breakdown.bonus.toLocaleString()}
                      </span>
                  </div>
                    <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded">
                      <span className="font-semibold">Gross Salary</span>
                      <span className="font-bold text-green-600">
                        ${summary.totalPayroll.toLocaleString()}
                      </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Income Tax</span>
                      <span className="font-medium">
                        ${summary.breakdown.incomeTax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Health Insurance</span>
                      <span className="font-medium">
                        ${summary.breakdown.healthInsurance.toLocaleString()}
                      </span>
                  </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Provident Fund</span>
                      <span className="font-medium">
                        ${summary.breakdown.providentFund.toLocaleString()}
                      </span>
                  </div>
                    <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded">
                      <span className="font-semibold">Total Deductions</span>
                      <span className="font-bold text-red-600">
                        ${summary.totalDeductions.toLocaleString()}
                      </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Net Salary</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${summary.netPayroll.toLocaleString()}
                    </span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Payroll management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Payslips
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calculator className="h-4 w-4 mr-2" />
              Tax Calculator
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Payroll Calendar
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Salary Reviews
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Employee Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
          <CardDescription>
            Individual employee salary information for {selectedMonth} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canProcess && <TableHead className="w-12"></TableHead>}
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canProcess ? 9 : 8} className="text-center py-8 text-gray-500">
                    No payroll records found for this period.
                    {canProcess && ' Click "Generate" to create payroll records.'}
                  </TableCell>
                </TableRow>
              ) : (
                payrollRecords.map((payroll) => (
                  <TableRow key={payroll.id}>
                    {canProcess && (
                      <TableCell>
                        {payroll.status === 'DRAFT' && (
                          <input
                            type="checkbox"
                            checked={selectedForProcess.includes(payroll.id)}
                            onChange={() => toggleSelectForProcess(payroll.id)}
                            className="h-4 w-4"
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payroll.employee?.firstName} {payroll.employee?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{payroll.employee?.employeeCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payroll.employee?.department?.name}</Badge>
                    </TableCell>
                    <TableCell>${payroll.basicSalary.toLocaleString()}</TableCell>
                    <TableCell>${payroll.allowances.toLocaleString()}</TableCell>
                    <TableCell>${payroll.totalDeductions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ${payroll.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payroll.status)}>{payroll.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(payroll)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canProcess && payroll.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(payroll)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(payroll)}
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

      {/* Generate Payroll Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
            <DialogDescription>
              Generate payroll records for all active employees for the specified period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={generateForm.periodStart}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, periodStart: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={generateForm.periodEnd}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, periodEnd: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateDialog(false);
                setError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleGeneratePayroll} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
            <DialogDescription>
              Update salary components for {selectedPayroll?.employee?.firstName}{' '}
              {selectedPayroll?.employee?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances ($)</Label>
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
                <Label htmlFor="overtime">Overtime ($)</Label>
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
                <Label htmlFor="bonus">Bonus ($)</Label>
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
                <Label htmlFor="incomeTax">Income Tax ($)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="healthInsurance">Health Insurance ($)</Label>
                <Input
                  id="healthInsurance"
                  type="number"
                  step="0.01"
                  value={editForm.healthInsurance}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      healthInsurance: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="providentFund">Provident Fund ($)</Label>
                <Input
                  id="providentFund"
                  type="number"
                  step="0.01"
                  value={editForm.providentFund}
                  onChange={(e) =>
                    setEditForm({ ...editForm, providentFund: Number(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="otherDeductions">Other Deductions ($)</Label>
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
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditPayroll} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              Complete payroll information for {selectedPayroll?.employee?.firstName}{' '}
              {selectedPayroll?.employee?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedPayroll && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{' '}
                    <span className="font-medium">
                      {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Code:</span>{' '}
                    <span className="font-medium">{selectedPayroll.employee?.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>{' '}
                    <span className="font-medium">
                      {selectedPayroll.employee?.department?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Designation:</span>{' '}
                    <span className="font-medium">{selectedPayroll.employee?.designation}</span>
                  </div>
                </div>
              </div>

              {/* Period Info */}
              <div>
                <h4 className="font-semibold mb-2">Pay Period</h4>
                <div className="text-sm">
                  {new Date(selectedPayroll.periodStart).toLocaleDateString()} -{' '}
                  {new Date(selectedPayroll.periodEnd).toLocaleDateString()}
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Earnings</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-medium">${selectedPayroll.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span className="font-medium">${selectedPayroll.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span className="font-medium">${selectedPayroll.overtime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonus:</span>
                    <span className="font-medium">${selectedPayroll.bonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Gross Salary:</span>
                    <span className="text-green-600">${selectedPayroll.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Deductions</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span className="font-medium">${selectedPayroll.incomeTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance:</span>
                    <span className="font-medium">${selectedPayroll.healthInsurance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund:</span>
                    <span className="font-medium">${selectedPayroll.providentFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="font-medium">${selectedPayroll.otherDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">${selectedPayroll.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Net Salary:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${selectedPayroll.netSalary.toLocaleString()}
                  </span>
              </div>
            </div>
            
              {/* Attendance Summary */}
              <div>
                <h4 className="font-semibold mb-2">Attendance Summary</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-gray-600">Working Days</div>
                    <div className="font-bold">{selectedPayroll.workingDays}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-gray-600">Present</div>
                    <div className="font-bold text-green-600">{selectedPayroll.presentDays}</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="text-gray-600">Absent</div>
                    <div className="font-bold text-red-600">{selectedPayroll.absentDays}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-gray-600">Leave</div>
                    <div className="font-bold text-blue-600">{selectedPayroll.leaveDays}</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge className={getStatusColor(selectedPayroll.status)}>
                  {selectedPayroll.status}
                </Badge>
            </div>
            
              {selectedPayroll.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedPayroll.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payroll Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payroll record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {payrollToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Payroll Details</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Employee:</span>{' '}
                  <span className="font-medium">
                    {payrollToDelete.employee?.firstName} {payrollToDelete.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Period:</span>{' '}
                  <span className="font-medium">
                    {new Date(payrollToDelete.periodStart).toLocaleDateString()} -{' '}
                    {new Date(payrollToDelete.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Net Salary:</span>{' '}
                  <span className="font-medium">${payrollToDelete.netSalary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>{' '}
                  <Badge className={getStatusColor(payrollToDelete.status)}>
                    {payrollToDelete.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPayrollToDelete(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayroll}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Payroll
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPage;
