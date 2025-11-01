import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
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
  listLeaveRequests,
  createLeaveRequest,
  updateLeaveStatus,
  updateLeaveRequest,
  getLeaveRequest,
  getLeaveBalance,
  cancelLeaveRequest,
  type LeaveRequest,
  type LeaveType,
  type LeaveStatus,
} from '@/services/leaves';
import { listEmployees, type Employee } from '@/services/employees';
import {
  Search,
  Plus,
  Download,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';

// Component to load and display available days for view dialog
const ViewRequestAvailableDays: React.FC<{ employeeId: string; leaveType: LeaveType }> = ({ employeeId, leaveType }) => {
  const [availableDays, setAvailableDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await getLeaveBalance(employeeId);
        let available = 0;
        switch (leaveType) {
          case 'CASUAL':
            available = balance.casualLeave;
            break;
          case 'SICK':
            available = balance.sickLeave;
            break;
          case 'VACATION':
            available = balance.vacationLeave;
            break;
          case 'PERSONAL':
            available = balance.personalLeave;
            break;
        }
        setAvailableDays(available);
      } catch (err) {
        console.error('Failed to load leave balance:', err);
        setAvailableDays(null);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
  }, [employeeId, leaveType]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  }

  if (availableDays === null) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <p className={`font-bold text-xl ${availableDays >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {availableDays.toFixed(1)} {availableDays === 1 ? 'day' : 'days'}
    </p>
  );
};

const LeaveRequestsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // Only ADMIN and MANAGER can access this page
  const isAdminOrManager = user?.roles?.some(role => 
    role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'MANAGER'
  ) || false;
  
  const canManage = isAdminOrManager && (hasPermission('leave.manage') || hasPermission('leave.approve'));
  const canCreateForOthers = isAdminOrManager && (hasPermission('leave.manage') || hasPermission('leave.approve'));

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'endDate' | 'days' | 'status'>('createdAt');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null);
  
  // Form states for new request
  const [newRequestForm, setNewRequestForm] = useState({
    employeeId: '',
    leaveType: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
  });
  const [availableDays, setAvailableDays] = useState<number>(0);
  
  // Form states for manage request
  const [manageForm, setManageForm] = useState({
    leaveType: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    comment: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [manageAvailableDays, setManageAvailableDays] = useState<number>(0);

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
    loadData();
    if (canCreateForOthers) {
      loadEmployees();
    }
  }, [page, pageSize, statusFilter, sortBy, canCreateForOthers]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        loadData();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load balance when both employee and leave type are selected in new request form
  useEffect(() => {
    if (showNewDialog && newRequestForm.employeeId && newRequestForm.leaveType) {
      loadLeaveBalance(newRequestForm.employeeId, newRequestForm.leaveType);
    } else if (showNewDialog && !newRequestForm.employeeId) {
      setAvailableDays(0);
    }
  }, [showNewDialog, newRequestForm.employeeId, newRequestForm.leaveType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await listLeaveRequests({
        status: statusFilter !== 'all' ? statusFilter as LeaveStatus : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder: 'desc',
        page,
        pageSize,
      });
      setRequests(response.items);
      setTotal(response.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await listEmployees({ page: 1, pageSize: 1000, status: 'ACTIVE' });
      setEmployees(response.items);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadLeaveBalance = async (employeeId: string, leaveType: LeaveType) => {
    try {
      const balance = await getLeaveBalance(employeeId);
      let available = 0;
      switch (leaveType) {
        case 'CASUAL':
          available = balance.casualLeave;
          break;
        case 'SICK':
          available = balance.sickLeave;
          break;
        case 'VACATION':
          available = balance.vacationLeave;
          break;
        case 'PERSONAL':
          available = balance.personalLeave;
          break;
      }
      setAvailableDays(available);
    } catch (err) {
      console.error('Failed to load leave balance:', err);
      setAvailableDays(0);
    }
  };

  const handleNewRequest = () => {
    setNewRequestForm({
      employeeId: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      halfDay: false,
    });
    setError('');
    setShowNewDialog(true);
  };

  const handleEmployeeSelect = async (employeeId: string) => {
    const updatedForm = { ...newRequestForm, employeeId };
    setNewRequestForm(updatedForm);
    // Load balance if leave type is already selected
    if (employeeId && updatedForm.leaveType) {
      const balance = await getLeaveBalance(employeeId);
      let available = 0;
      switch (updatedForm.leaveType) {
        case 'CASUAL':
          available = balance.casualLeave;
          break;
        case 'SICK':
          available = balance.sickLeave;
          break;
        case 'VACATION':
          available = balance.vacationLeave;
          break;
        case 'PERSONAL':
          available = balance.personalLeave;
          break;
      }
      setAvailableDays(available);
    }
  };

  const handleLeaveTypeChange = async (leaveType: LeaveType) => {
    const updatedForm = { ...newRequestForm, leaveType };
    setNewRequestForm(updatedForm);
    // Load balance if employee is already selected
    if (updatedForm.employeeId && leaveType) {
      const balance = await getLeaveBalance(updatedForm.employeeId);
      let available = 0;
      switch (leaveType) {
        case 'CASUAL':
          available = balance.casualLeave;
          break;
        case 'SICK':
          available = balance.sickLeave;
          break;
        case 'VACATION':
          available = balance.vacationLeave;
          break;
        case 'PERSONAL':
          available = balance.personalLeave;
          break;
      }
      setAvailableDays(available);
    } else {
      // Reset available days if no employee selected
      setAvailableDays(0);
    }
  };

  const calculateDays = () => {
    if (newRequestForm.startDate && newRequestForm.endDate) {
      const start = new Date(newRequestForm.startDate);
      const end = new Date(newRequestForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return newRequestForm.halfDay && start.toDateString() === end.toDateString() ? 0.5 : diffDays;
    }
    return 0;
  };

  const handleSubmitNewRequest = async () => {
    if (!newRequestForm.leaveType || !newRequestForm.startDate || !newRequestForm.endDate || !newRequestForm.reason) {
      setError('Please fill all required fields');
      return;
    }

    if (!canCreateForOthers && !newRequestForm.employeeId) {
      // For regular employees, use their own employeeId
      if (!user?.employeeId) {
        setError('Employee record not found');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      await createLeaveRequest({
        employeeId: canCreateForOthers && newRequestForm.employeeId ? newRequestForm.employeeId : undefined,
        type: newRequestForm.leaveType,
        startDate: newRequestForm.startDate,
        endDate: newRequestForm.endDate,
        reason: newRequestForm.reason,
        halfDay: newRequestForm.halfDay,
      });
      toast.success('Leave request created successfully!');
      setShowNewDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageRequest = async (request: LeaveRequest) => {
    try {
      const fullRequest = await getLeaveRequest(request.id);
      setSelectedRequest(fullRequest);
      setManageForm({
        leaveType: fullRequest.type,
        startDate: format(new Date(fullRequest.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(fullRequest.endDate), 'yyyy-MM-dd'),
        reason: fullRequest.reason,
        halfDay: false, // We don't store this in the request, so default to false
        comment: '',
      });
      setIsEditing(false);
      setError('');
      setShowManageDialog(true);
      
      // Load available days for this employee and leave type
      if (canManage) {
        const balance = await getLeaveBalance(fullRequest.employeeId);
        let available = 0;
        switch (fullRequest.type) {
          case 'CASUAL':
            available = balance.casualLeave;
            break;
          case 'SICK':
            available = balance.sickLeave;
            break;
          case 'VACATION':
            available = balance.vacationLeave;
            break;
          case 'PERSONAL':
            available = balance.personalLeave;
            break;
        }
        setManageAvailableDays(available);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load leave request');
    }
  };

  const handleViewRequest = async (request: LeaveRequest) => {
    try {
      const fullRequest = await getLeaveRequest(request.id);
      setSelectedRequest(fullRequest);
      setShowViewDialog(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load leave request');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError('');
      await updateLeaveStatus(selectedRequest.id, {
        status: 'APPROVED',
        comment: manageForm.comment,
      });
      toast.success('Leave request approved successfully!');
      setShowManageDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to approve leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;

    if (!manageForm.leaveType || !manageForm.startDate || !manageForm.endDate || !manageForm.reason) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateLeaveRequest(selectedRequest.id, {
        type: manageForm.leaveType,
        startDate: manageForm.startDate,
        endDate: manageForm.endDate,
        reason: manageForm.reason,
        halfDay: manageForm.halfDay,
      });
      toast.success('Leave request updated successfully!');
      setIsEditing(false);
      await loadData();
      // Reload the request to get updated data
      const updatedRequest = await getLeaveRequest(selectedRequest.id);
      setSelectedRequest(updatedRequest);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError('');
      await updateLeaveStatus(selectedRequest.id, {
        status: 'REJECTED',
        rejectionReason: manageForm.comment,
      });
      toast.success('Leave request rejected');
      setShowManageDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to reject leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (request: LeaveRequest) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    try {
      await cancelLeaveRequest(requestToDelete.id);
      toast.success('Leave request cancelled successfully!');
      setShowDeleteDialog(false);
      setRequestToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    return leaveTypes.find(t => t.value === type)?.color || 'gray';
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    return leaveTypes.find(t => t.value === type)?.label || type;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const totalPages = Math.ceil(total / pageSize);

  // Access control check
  if (!isAdminOrManager) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Only Administrators and Managers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-1">Manage and approve employee leave requests</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleNewRequest} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input type="checkbox" className="rounded" />
                      </TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>EMPLOYEE</TableHead>
                      <TableHead>LEAVE TYPE</TableHead>
                      <TableHead>PERIOD</TableHead>
                      <TableHead>DAYS</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request, index) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <input type="checkbox" className="rounded" />
                          </TableCell>
                          <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                  {getInitials(request.employee.firstName, request.employee.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.employee.firstName} {request.employee.lastName}</p>
                                <p className="text-sm text-gray-500">{request.employee.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`h-3 w-3 rounded-full ${
                                getLeaveTypeColor(request.type) === 'purple' ? 'bg-purple-500' :
                                getLeaveTypeColor(request.type) === 'blue' ? 'bg-blue-500' :
                                getLeaveTypeColor(request.type) === 'green' ? 'bg-green-500' :
                                getLeaveTypeColor(request.type) === 'pink' ? 'bg-pink-500' :
                                getLeaveTypeColor(request.type) === 'orange' ? 'bg-orange-500' :
                                'bg-gray-500'
                              }`}></div>
                              <span>{getLeaveTypeLabel(request.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(request.startDate), 'dd/MM/yyyy')} - {format(new Date(request.endDate), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && request.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleManageRequest(request)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {(canManage || request.employeeId === user?.employeeId) && request.status === 'PENDING' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(request)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-4 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Row per page:</span>
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
                    <span className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium">
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

      {/* New Leave Request Dialog */}
      <Dialog open={showNewDialog} onOpenChange={(open) => { setShowNewDialog(open); if (!open) setError(''); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
            <DialogDescription>Create a new leave request for an employee</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {canCreateForOthers && (
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={newRequestForm.employeeId}
                  onValueChange={handleEmployeeSelect}
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
            )}

            <div>
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={newRequestForm.leaveType}
                onValueChange={(value) => handleLeaveTypeChange(value as LeaveType)}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newRequestForm.startDate}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newRequestForm.endDate}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, endDate: e.target.value })}
                  min={newRequestForm.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="halfDay">Half Day</Label>
                <p className="text-sm text-gray-500">Apply for half day on the last day</p>
              </div>
              <Switch
                id="halfDay"
                checked={newRequestForm.halfDay}
                onCheckedChange={(checked) => setNewRequestForm({ ...newRequestForm, halfDay: checked })}
              />
            </div>

            {newRequestForm.startDate && newRequestForm.endDate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Available Days:</Label>
                  <p className="text-lg font-semibold text-green-600">{availableDays.toFixed(1)}</p>
                </div>
                <div>
                  <Label>Requested Days:</Label>
                  <p className="text-lg font-semibold">{calculateDays().toFixed(1)}</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Personal time"
                value={newRequestForm.reason}
                onChange={(e) => setNewRequestForm({ ...newRequestForm, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNewRequest} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Leave Request Dialog */}
      {selectedRequest && (
        <Dialog open={showManageDialog} onOpenChange={(open) => { setShowManageDialog(open); if (!open) setError(''); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Leave Request</DialogTitle>
              <DialogDescription>Review and approve or reject this leave request</DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {isEditing && canManage ? (
                <>
                  <div>
                    <Label htmlFor="edit-leaveType">Leave Type *</Label>
                    <Select
                      value={manageForm.leaveType}
                      onValueChange={async (value) => {
                        setManageForm({ ...manageForm, leaveType: value as LeaveType });
                        if (selectedRequest && value) {
                          const balance = await getLeaveBalance(selectedRequest.employeeId);
                          let available = 0;
                          switch (value as LeaveType) {
                            case 'CASUAL':
                              available = balance.casualLeave;
                              break;
                            case 'SICK':
                              available = balance.sickLeave;
                              break;
                            case 'VACATION':
                              available = balance.vacationLeave;
                              break;
                            case 'PERSONAL':
                              available = balance.personalLeave;
                              break;
                          }
                          setManageAvailableDays(available);
                        }
                      }}
                    >
                      <SelectTrigger id="edit-leaveType">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startDate">Start Date *</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={manageForm.startDate}
                        onChange={(e) => setManageForm({ ...manageForm, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endDate">End Date *</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={manageForm.endDate}
                        onChange={(e) => setManageForm({ ...manageForm, endDate: e.target.value })}
                        min={manageForm.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="edit-halfDay">Half Day</Label>
                      <p className="text-sm text-gray-500">Apply for half day on the last day</p>
                    </div>
                    <Switch
                      id="edit-halfDay"
                      checked={manageForm.halfDay}
                      onCheckedChange={(checked) => setManageForm({ ...manageForm, halfDay: checked })}
                    />
                  </div>

                  {manageForm.startDate && manageForm.endDate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Available Days:</Label>
                        <p className="text-lg font-semibold text-green-600">{manageAvailableDays.toFixed(1)}</p>
                      </div>
                      <div>
                        <Label>Requested Days:</Label>
                        <p className="text-lg font-semibold">{(() => {
                          if (manageForm.startDate && manageForm.endDate) {
                            const start = new Date(manageForm.startDate);
                            const end = new Date(manageForm.endDate);
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            return manageForm.halfDay && start.toDateString() === end.toDateString() ? 0.5 : diffDays;
                          }
                          return 0;
                        })().toFixed(1)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="edit-reason">Reason *</Label>
                    <Textarea
                      id="edit-reason"
                      value={manageForm.reason}
                      onChange={(e) => setManageForm({ ...manageForm, reason: e.target.value })}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Leave Type *</Label>
                    <Input value={getLeaveTypeLabel(selectedRequest.type)} disabled />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={format(new Date(selectedRequest.startDate), 'yyyy-MM-dd')}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={format(new Date(selectedRequest.endDate), 'yyyy-MM-dd')}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Reason</Label>
                    <Textarea value={selectedRequest.reason} disabled rows={3} />
                  </div>
                </>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Status: {selectedRequest.status}</AlertDescription>
              </Alert>

              {!isEditing && (
                <div>
                  <Label htmlFor="comment">Comment (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add a comment with your decision"
                    value={manageForm.comment}
                    onChange={(e) => setManageForm({ ...manageForm, comment: e.target.value })}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>
                    Cancel Edit
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowManageDialog(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  {canManage && selectedRequest.status === 'PENDING' && (
                    <Button variant="outline" onClick={() => setIsEditing(true)} disabled={submitting}>
                      Edit Request
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={submitting || selectedRequest.status !== 'PENDING'}
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={submitting || selectedRequest.status !== 'PENDING'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Leave Request Dialog */}
      {selectedRequest && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Leave Request Details</DialogTitle>
              <DialogDescription className="text-base">
                <div className="flex items-center space-x-2 mt-2">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      {getInitials(selectedRequest.employee.firstName, selectedRequest.employee.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedRequest.employee.firstName} {selectedRequest.employee.lastName}</p>
                    <p className="text-sm text-gray-500">{selectedRequest.employee.email}</p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Employee Info Card */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">Employee</Label>
                      <p className="font-semibold text-base">{selectedRequest.employee.firstName} {selectedRequest.employee.lastName}</p>
                      {selectedRequest.employee.designation && (
                        <p className="text-sm text-gray-600">{selectedRequest.employee.designation}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 uppercase">Email</Label>
                      <p className="text-sm">{selectedRequest.employee.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Leave Type</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${
                      getLeaveTypeColor(selectedRequest.type) === 'purple' ? 'bg-purple-500' :
                      getLeaveTypeColor(selectedRequest.type) === 'blue' ? 'bg-blue-500' :
                      getLeaveTypeColor(selectedRequest.type) === 'green' ? 'bg-green-500' :
                      getLeaveTypeColor(selectedRequest.type) === 'pink' ? 'bg-pink-500' :
                      getLeaveTypeColor(selectedRequest.type) === 'orange' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}></div>
                    <Badge variant="outline" className="text-base">{getLeaveTypeLabel(selectedRequest.type)}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>  
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Start Date</Label>
                  <p className="font-semibold text-base">{format(new Date(selectedRequest.startDate), 'dd/MM/yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">End Date</Label>
                  <p className="font-semibold text-base">{format(new Date(selectedRequest.endDate), 'dd/MM/yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Requested Days</Label>
                  <p className="font-bold text-xl">{selectedRequest.days} {selectedRequest.days === 1 ? 'day' : 'days'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase">Available Days</Label>
                  <ViewRequestAvailableDays employeeId={selectedRequest.employeeId} leaveType={selectedRequest.type} />
                </div>
              </div>

              {/* Reason Card */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <Label className="text-xs text-gray-500 uppercase mb-2 block">Reason</Label>
                  <p className="text-sm leading-relaxed">{selectedRequest.reason}</p>
                </CardContent>
              </Card>

              {/* Approval Info */}
              {selectedRequest.approver && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <Label className="text-xs text-gray-500 uppercase mb-2 block">Approved/Rejected By</Label>
                    <p className="font-semibold">{selectedRequest.approver.firstName} {selectedRequest.approver.lastName}</p>
                    {selectedRequest.approvedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(selectedRequest.approvedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comment/Rejection Reason */}
              {selectedRequest.rejectionReason && (
                <Card className={selectedRequest.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-gray-50'}>
                  <CardContent className="p-4">
                    <Label className="text-xs text-gray-500 uppercase mb-2 block">
                      {selectedRequest.status === 'REJECTED' ? 'Rejection Reason' : 'Comment'}
                    </Label>
                    <p className="text-sm leading-relaxed">{selectedRequest.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              {canManage && selectedRequest.status === 'PENDING' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleManageRequest(selectedRequest);
                  }}
                >
                  Manage Request
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {requestToDelete && (
            <div className="space-y-2">
              <p className="text-sm"><strong>Employee:</strong> {requestToDelete.employee.firstName} {requestToDelete.employee.lastName}</p>
              <p className="text-sm"><strong>Leave Type:</strong> {getLeaveTypeLabel(requestToDelete.type)}</p>
              <p className="text-sm"><strong>Period:</strong> {format(new Date(requestToDelete.startDate), 'dd/MM/yyyy')} - {format(new Date(requestToDelete.endDate), 'dd/MM/yyyy')}</p>
              <p className="text-sm"><strong>Days:</strong> {requestToDelete.days}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setRequestToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveRequestsPage;

