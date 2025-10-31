import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  listLeaveBalances,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  carryOverLeave,
  type LeaveBalance,
  type LeaveType,
  type CreateLeaveBalancePayload,
} from '@/services/leave-balances';
import { listEmployees, type Employee } from '@/services/employees';
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const LeaveBalancesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('leave.manage');
  const canRead = hasPermission('leave.read') || canManage;

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('employee');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [selectedBalanceForDelete, setSelectedBalanceForDelete] = useState<LeaveBalance | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateLeaveBalancePayload>({
    employeeId: '',
    leaveType: 'CASUAL',
    year: new Date().getFullYear(),
    allocatedDays: 0,
    carriedOver: 0,
  });
  const [carryOverData, setCarryOverData] = useState({
    employeeId: '',
    leaveType: 'CASUAL' as LeaveType,
    fromYear: new Date().getFullYear() - 1,
    toYear: new Date().getFullYear(),
    daysToCarryOver: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const leaveTypes: { value: LeaveType; label: string; color: string }[] = [
    { value: 'CASUAL', label: 'Casual Leave', color: 'purple' },
    { value: 'SICK', label: 'Sick Leave', color: 'blue' },
    { value: 'VACATION', label: 'Vacation', color: 'green' },
    { value: 'MATERNITY', label: 'Maternity Leave', color: 'pink' },
    { value: 'PERSONAL', label: 'Personal Leave', color: 'orange' },
  ];

  // Load data
  useEffect(() => {
    if (canRead) {
      loadData();
      loadEmployees();
    }
  }, [canRead, page, pageSize, yearFilter, leaveTypeFilter, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await listLeaveBalances({
        year: yearFilter,
        leaveType: leaveTypeFilter !== 'all' ? leaveTypeFilter as LeaveType : undefined,
        page,
        pageSize,
        search: searchTerm || undefined,
      });
      setBalances(response.items);
      setTotal(response.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await listEmployees({ page: 1, pageSize: 1000 });
      setEmployees(response.items);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    // Debounce search
    setTimeout(() => {
      loadData();
    }, 300);
  };

  const handleAdd = () => {
    setFormData({
      employeeId: '',
      leaveType: 'CASUAL',
      year: new Date().getFullYear(),
      allocatedDays: 0,
      carriedOver: 0,
    });
    setError('');
    setShowAddDialog(true);
  };

  const handleEdit = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    setFormData({
      employeeId: balance.employeeId,
      leaveType: balance.leaveType,
      year: balance.year,
      allocatedDays: balance.allocatedDays,
      carriedOver: balance.carriedOver,
    });
    setError('');
    setShowEditDialog(true);
  };

  const handleView = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    setShowViewDialog(true);
  };

  const handleDelete = (balance: LeaveBalance) => {
    setSelectedBalanceForDelete(balance);
    setShowDeleteDialog(true);
  };

  const handleCarryOver = (balance: LeaveBalance) => {
    setCarryOverData({
      employeeId: balance.employeeId,
      leaveType: balance.leaveType,
      fromYear: balance.year,
      toYear: balance.year + 1,
      daysToCarryOver: Math.max(0, balance.availableDays),
    });
    setError('');
    setShowCarryOverDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.leaveType || formData.allocatedDays <= 0) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (showAddDialog) {
        await createLeaveBalance(formData);
        toast.success('Leave balance created successfully!');
        setShowAddDialog(false);
      } else if (showEditDialog && selectedBalance) {
        await updateLeaveBalance(selectedBalance.id, {
          allocatedDays: formData.allocatedDays,
          carriedOver: formData.carriedOver,
        });
        toast.success('Leave balance updated successfully!');
        setShowEditDialog(false);
      }

      await loadData();
      setFormData({
        employeeId: '',
        leaveType: 'CASUAL',
        year: new Date().getFullYear(),
        allocatedDays: 0,
        carriedOver: 0,
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save leave balance';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBalanceForDelete) return;

    try {
      await deleteLeaveBalance(selectedBalanceForDelete.id);
      toast.success('Leave balance deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedBalanceForDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete leave balance');
    }
  };

  const handleCarryOverSubmit = async () => {
    if (carryOverData.daysToCarryOver <= 0) {
      setError('Days to carry over must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await carryOverLeave(carryOverData);
      toast.success(`Successfully carried over ${carryOverData.daysToCarryOver} days to ${carryOverData.toYear}!`);
      setShowCarryOverDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to carry over leave';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    const leaveType = leaveTypes.find(t => t.value === type);
    if (!leaveType) return 'gray';
    return leaveType.color;
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    return leaveTypes.find(t => t.value === type)?.label || type;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredBalances = useMemo(() => {
    if (!searchTerm) return balances;
    const search = searchTerm.toLowerCase();
    return balances.filter(b => 
      b.employee.firstName.toLowerCase().includes(search) ||
      b.employee.lastName.toLowerCase().includes(search) ||
      b.employee.email.toLowerCase().includes(search) ||
      b.employee.employeeCode.toLowerCase().includes(search)
    );
  }, [balances, searchTerm]);

  const totalPages = Math.ceil(total / pageSize);

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-sm text-gray-600">
                  You don't have permission to view leave balances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Balances</h1>
          <p className="text-gray-600 mt-1">Manage employee leave entitlements and balances</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canManage && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Balance
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${total} records...`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={yearFilter.toString()} onValueChange={(v) => { setYearFilter(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={leaveTypeFilter} onValueChange={(v) => { setLeaveTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {leaveTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="leaveType">Leave Type</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="available">Available Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
          <CardDescription>View and manage employee leave entitlements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>EMPLOYEE</TableHead>
                      <TableHead>LEAVE TYPE</TableHead>
                      <TableHead>YEAR</TableHead>
                      <TableHead>ALLOCATED DAYS</TableHead>
                      <TableHead>USED DAYS</TableHead>
                      <TableHead>CARRIED OVER</TableHead>
                      <TableHead>AVAILABLE</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No leave balances found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBalances.map((balance, index) => {
                        const leaveTypeInfo = leaveTypes.find(t => t.value === balance.leaveType);
                        return (
                          <TableRow key={balance.id}>
                            <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                    {getInitials(balance.employee.firstName, balance.employee.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{balance.employee.firstName} {balance.employee.lastName}</p>
                                  <p className="text-sm text-gray-500">{balance.employee.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className={`h-3 w-3 rounded-full bg-${leaveTypeInfo?.color || 'gray'}-500`}></div>
                                <span>{getLeaveTypeLabel(balance.leaveType)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{balance.year}</TableCell>
                            <TableCell>{balance.allocatedDays.toFixed(1)}</TableCell>
                            <TableCell>{balance.usedDays.toFixed(1)}</TableCell>
                            <TableCell>{balance.carriedOver.toFixed(1)}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                {balance.availableDays.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(balance)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canManage && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(balance)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDelete(balance)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
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
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={page}
                      onChange={(e) => setPage(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
                      className="w-16"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      K
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      &lt;
                    </Button>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                      {page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      &gt;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      &gt;I
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Leave Balance Dialog */}
      {canManage && (
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setError(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Leave Balance</DialogTitle>
              <DialogDescription>Create a new leave balance for an employee</DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger id="employee">
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
                <div>
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) => setFormData({ ...formData, leaveType: value as LeaveType })}
                  >
                    <SelectTrigger id="leaveType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    min={2020}
                    max={2100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="allocatedDays">Allocated Days *</Label>
                  <Input
                    id="allocatedDays"
                    type="number"
                    step="0.1"
                    value={formData.allocatedDays}
                    onChange={(e) => setFormData({ ...formData, allocatedDays: Number(e.target.value) })}
                    min={0}
                  />
                </div>

                <div>
                  <Label htmlFor="carriedOver">Carried Over Days</Label>
                  <Input
                    id="carriedOver"
                    type="number"
                    step="0.1"
                    value={formData.carriedOver || 0}
                    onChange={(e) => setFormData({ ...formData, carriedOver: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Leave Balance Dialog */}
      {canManage && selectedBalance && (
        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setError(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Leave Balance</DialogTitle>
              <DialogDescription>Update leave balance for {selectedBalance.employee.firstName} {selectedBalance.employee.lastName}</DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <Input value={`${selectedBalance.employee.firstName} ${selectedBalance.employee.lastName}`} disabled />
                </div>
                <div>
                  <Label>Leave Type</Label>
                  <Input value={getLeaveTypeLabel(selectedBalance.leaveType)} disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-allocatedDays">Allocated Days *</Label>
                  <Input
                    id="edit-allocatedDays"
                    type="number"
                    step="0.1"
                    value={formData.allocatedDays}
                    onChange={(e) => setFormData({ ...formData, allocatedDays: Number(e.target.value) })}
                    min={0}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-usedDays">Used Days</Label>
                  <Input
                    id="edit-usedDays"
                    type="number"
                    step="0.1"
                    value={selectedBalance.usedDays}
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="edit-carriedOver">Carried Over</Label>
                  <Input
                    id="edit-carriedOver"
                    type="number"
                    step="0.1"
                    value={formData.carriedOver || 0}
                    onChange={(e) => setFormData({ ...formData, carriedOver: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Available Days: <span className="font-bold">{(formData.allocatedDays - selectedBalance.usedDays + (formData.carriedOver || 0)).toFixed(1)}</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Leave Balance Dialog */}
      {selectedBalance && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Balance Details</DialogTitle>
              <DialogDescription>
                {selectedBalance.employee.firstName} {selectedBalance.employee.lastName} - {getLeaveTypeLabel(selectedBalance.leaveType)} ({selectedBalance.year})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="font-medium">{selectedBalance.employee.firstName} {selectedBalance.employee.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedBalance.employee.email}</p>
                </div>
                <div>
                  <Label>Leave Type</Label>
                  <Badge variant="outline">{getLeaveTypeLabel(selectedBalance.leaveType)}</Badge>
                </div>
                <div>
                  <Label>Year</Label>
                  <p className="font-medium">{selectedBalance.year}</p>
                </div>
                <div>
                  <Label>Allocated Days</Label>
                  <p className="font-medium">{selectedBalance.allocatedDays.toFixed(1)}</p>
                </div>
                <div>
                  <Label>Used Days</Label>
                  <p className="font-medium">{selectedBalance.usedDays.toFixed(1)}</p>
                </div>
                <div>
                  <Label>Carried Over</Label>
                  <p className="font-medium">{selectedBalance.carriedOver.toFixed(1)}</p>
                </div>
                <div className="col-span-2">
                  <Label>Available Days</Label>
                  <p className="text-2xl font-bold text-green-600">{selectedBalance.availableDays.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleCarryOver(selectedBalance);
                  }}
                >
                  Carry Over to Next Year
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Carry Over Dialog */}
      {canManage && (
        <Dialog open={showCarryOverDialog} onOpenChange={(open) => { setShowCarryOverDialog(open); if (!open) setError(''); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Carry Over Leave</DialogTitle>
              <DialogDescription>
                Transfer unused leave balance from {carryOverData.fromYear} to {carryOverData.toYear}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Input
                  value={employees.find(e => e.id === carryOverData.employeeId) 
                    ? `${employees.find(e => e.id === carryOverData.employeeId)?.firstName} ${employees.find(e => e.id === carryOverData.employeeId)?.lastName}`
                    : ''}
                  disabled
                />
              </div>
              <div>
                <Label>Leave Type</Label>
                <Input value={getLeaveTypeLabel(carryOverData.leaveType)} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Year</Label>
                  <Input value={carryOverData.fromYear} disabled />
                </div>
                <div>
                  <Label>To Year</Label>
                  <Input value={carryOverData.toYear} disabled />
                </div>
              </div>
              <div>
                <Label htmlFor="daysToCarryOver">Days to Carry Over *</Label>
                <Input
                  id="daysToCarryOver"
                  type="number"
                  step="0.1"
                  value={carryOverData.daysToCarryOver}
                  onChange={(e) => setCarryOverData({ ...carryOverData, daysToCarryOver: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCarryOverDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCarryOverSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Carry Over
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {canManage && (
        <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setSelectedBalanceForDelete(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Leave Balance</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this leave balance? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedBalanceForDelete && (
              <div className="space-y-2">
                <p className="text-sm"><strong>Employee:</strong> {selectedBalanceForDelete.employee.firstName} {selectedBalanceForDelete.employee.lastName}</p>
                <p className="text-sm"><strong>Leave Type:</strong> {getLeaveTypeLabel(selectedBalanceForDelete.leaveType)}</p>
                <p className="text-sm"><strong>Year:</strong> {selectedBalanceForDelete.year}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LeaveBalancesPage;

