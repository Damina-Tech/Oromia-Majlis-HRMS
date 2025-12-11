import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter } from
'@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
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
  type LeaveBalance,
  type LeaveType,
  type LeaveStatus,
} from '@/services/leaves';
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import { format, startOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const LeaveManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [customSingleDate, setCustomSingleDate] = useState<Date | undefined>(undefined);
  const [customDateType, setCustomDateType] = useState<'range' | 'single'>('range');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states for view/edit/delete
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    leaveType: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
  });
  const [editAvailableDays, setEditAvailableDays] = useState<number>(0);

  const leaveTypes: { value: LeaveType; label: string }[] = [
    { value: 'CASUAL', label: 'Casual Leave' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'VACATION', label: 'Vacation' },
    { value: 'MATERNITY', label: 'Maternity Leave' },
    { value: 'PERSONAL', label: 'Personal Leave' },
  ];

  const employeeId = user?.employeeId;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (employeeId) {
        loadData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data on mount and when filters change
  useEffect(() => {
    if (employeeId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [employeeId, dateFilter, customStartDate, customEndDate, customSingleDate, customDateType, statusFilter, typeFilter]);

  // Calculate date range based on filter
  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'today': {
        const today = startOfDay(now);
        return {
          startDate: format(today, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        };
      }
      case 'yesterday': {
        const yesterday = startOfDay(subDays(now, 1));
        return {
          startDate: format(yesterday, 'yyyy-MM-dd'),
          endDate: format(yesterday, 'yyyy-MM-dd'),
        };
      }
      case 'thisWeek': {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        };
      }
      case 'lastWeek': {
        const lastWeek = subWeeks(now, 1);
        const weekStart = startOfWeek(lastWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 });
        return {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        };
      }
      case 'thisMonth': {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return {
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        };
      }
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        const monthStart = startOfMonth(lastMonth);
        const monthEnd = endOfMonth(lastMonth);
        return {
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        };
      }
      case 'custom': {
        if (customDateType === 'single' && customSingleDate) {
          return {
            startDate: format(customSingleDate, 'yyyy-MM-dd'),
            endDate: format(customSingleDate, 'yyyy-MM-dd'),
          };
        } else if (customDateType === 'range' && customStartDate && customEndDate) {
          return {
            startDate: format(customStartDate, 'yyyy-MM-dd'),
            endDate: format(customEndDate, 'yyyy-MM-dd'),
          };
        }
        return {};
      }
      default:
        return {};
    }
  };

  const loadData = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const dateRange = getDateRange();
      const [requests, leaveBalance] = await Promise.all([
        listLeaveRequests({ 
          page: 1, 
          pageSize: 100, 
          employeeId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          status: statusFilter !== 'all' ? statusFilter as any : undefined,
          type: typeFilter !== 'all' ? typeFilter as any : undefined,
        }),
        getLeaveBalance(employeeId),
      ]);
      
      // Apply client-side filtering for search
      let filteredRequests = requests.items;
      
      if (searchTerm) {
        filteredRequests = filteredRequests.filter(req => 
          req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply client-side status filter if needed (if backend doesn't support it well)
      if (statusFilter !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
      }
      
      // Apply client-side type filter if needed (if backend doesn't support it well)
      if (typeFilter !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.type === typeFilter);
      }
      
      setLeaveRequests(filteredRequests);
      setBalance(leaveBalance);
    } catch (err) {
      console.error('Load data error:', err);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate || !reason) {
      setError('Please fill all required fields');
      return;
    }

    if (reason.length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await createLeaveRequest({
        type: leaveType as LeaveType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason,
      });

      const days = calculateDays();
      toast.success(`Leave request for ${days} day(s) submitted successfully!`);

      // Reset form
      setLeaveType('');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setIsDialogOpen(false);

      // Reload data
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateLeaveStatus(id, { status: 'APPROVED' });
      toast.success('Leave request approved successfully!');
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to approve leave request';
      toast.error(message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateLeaveStatus(id, { status: 'REJECTED' });
      toast.success('Leave request rejected');
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reject leave request';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <Check className="h-4 w-4" />;
      case 'REJECTED':
        return <X className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    const found = leaveTypes.find(t => t.value === type);
    return found?.label || type;
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

  const handleEditRequest = async (request: LeaveRequest) => {
    if (request.status !== 'PENDING') {
      toast.error('Only pending requests can be edited');
      return;
    }

    try {
      const fullRequest = await getLeaveRequest(request.id);
      setSelectedRequest(fullRequest);
      setEditForm({
        leaveType: fullRequest.type,
        startDate: fullRequest.startDate.split('T')[0],
        endDate: fullRequest.endDate.split('T')[0],
        reason: fullRequest.reason,
        halfDay: (fullRequest as any).halfDay || false,
      });
      
      // Load available days for the leave type
      if (employeeId) {
        const leaveBalance = await getLeaveBalance(employeeId);
        let available = 0;
        switch (fullRequest.type) {
          case 'CASUAL':
            available = leaveBalance.casualLeave;
            break;
          case 'SICK':
            available = leaveBalance.sickLeave;
            break;
          case 'VACATION':
            available = leaveBalance.vacationLeave;
            break;
          case 'PERSONAL':
            available = leaveBalance.personalLeave;
            break;
        }
        setEditAvailableDays(available);
      }
      
      setShowEditDialog(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load leave request');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    if (!editForm.leaveType || !editForm.startDate || !editForm.endDate || !editForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editForm.reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateLeaveRequest(selectedRequest.id, {
        type: editForm.leaveType,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        reason: editForm.reason,
        halfDay: editForm.halfDay,
      });
      toast.success('Leave request updated successfully!');
      setShowEditDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update leave request';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (request: LeaveRequest) => {
    if (request.status !== 'PENDING') {
      toast.error('Only pending requests can be cancelled');
      return;
    }
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

  const calculateEditDays = () => {
    if (editForm.startDate && editForm.endDate) {
      const start = new Date(editForm.startDate);
      const end = new Date(editForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return editForm.halfDay && start.toDateString() === end.toDateString() ? 0.5 : diffDays;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Session Update Required</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please log out and log back in to access the leave management system.
                </p>
                <Alert variant="default" className="mb-4">
                  <AlertDescription className="text-left">
                    <strong>Why is this needed?</strong>
                    <p className="mt-2">
                      Your session was created before employee linking was enabled. 
                      Simply logging out and back in will update your session with the required information.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
              <Button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                variant="default"
              >
                Logout and Login Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-id="agjo5yvol" data-path="src/pages/LeaveManagement.tsx">
        <div data-id="t7wl3eexj" data-path="src/pages/LeaveManagement.tsx">
          <h1 className="text-3xl font-bold text-gray-900" data-id="wofyxd5jv" data-path="src/pages/LeaveManagement.tsx">Leave Management</h1>
          <p className="text-gray-600 mt-1" data-id="gttztqm8g" data-path="src/pages/LeaveManagement.tsx">Apply for leave and track your requests</p>
        </div>
        
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => { 
            setIsDialogOpen(open); 
            if (!open) setError(''); 
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave request for approval
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
              
              <div className="grid grid-cols-2 gap-6 py-4" data-id="sbl526ukd" data-path="src/pages/LeaveManagement.tsx">
                <div className="space-y-4" data-id="9n8q3eis0" data-path="src/pages/LeaveManagement.tsx">
                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                      <SelectTrigger>
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

                  <div data-id="le3hhequj" data-path="src/pages/LeaveManagement.tsx">
                    <Label data-id="eqjuafvea" data-path="src/pages/LeaveManagement.tsx">Start Date</Label>
                    <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()} data-id="kq67dnhaj" data-path="src/pages/LeaveManagement.tsx" />

                  </div>
                </div>

                <div className="space-y-4" data-id="1pwovwfv1" data-path="src/pages/LeaveManagement.tsx">
                  <div data-id="cno74qjwd" data-path="src/pages/LeaveManagement.tsx">
                    <Label data-id="5jt4yeewg" data-path="src/pages/LeaveManagement.tsx">End Date</Label>
                    <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="rounded-md border"
                    disabled={(date) => date < (startDate || new Date())} data-id="ulpoc1azi" data-path="src/pages/LeaveManagement.tsx" />

                  </div>

                  {startDate && endDate &&
                <div className="bg-blue-50 p-3 rounded-lg" data-id="3nhvzras0" data-path="src/pages/LeaveManagement.tsx">
                      <p className="text-sm font-medium text-blue-800" data-id="t91ggzp4u" data-path="src/pages/LeaveManagement.tsx">
                        Duration: {calculateDays()} day(s)
                      </p>
                    </div>
                }
                </div>
              </div>

              <div className="space-y-4" data-id="mpkbqltxk" data-path="src/pages/LeaveManagement.tsx">
                <div data-id="e88gyqcm2" data-path="src/pages/LeaveManagement.tsx">
                  <Label htmlFor="reason" data-id="rvqozytuf" data-path="src/pages/LeaveManagement.tsx">Reason</Label>
                  <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3} data-id="jm4lebxkg" data-path="src/pages/LeaveManagement.tsx" />

                </div>

              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Casual Leave</p>
                <p className="text-2xl font-bold">{balance?.casualLeave || 0}</p>
                <p className="text-xs text-gray-500">days available</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sick Leave</p>
                <p className="text-2xl font-bold">{balance?.sickLeave || 0}</p>
                <p className="text-xs text-gray-500">days available</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vacation Leave</p>
                <p className="text-2xl font-bold">{balance?.vacationLeave || 0}</p>
                <p className="text-xs text-gray-500">days available</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Personal Leave</p>
                <p className="text-2xl font-bold">{balance?.personalLeave || 0}</p>
                <p className="text-xs text-gray-500">days available</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card data-id="lru4h97kd" data-path="src/pages/LeaveManagement.tsx">
        <CardHeader data-id="rr4di7p4x" data-path="src/pages/LeaveManagement.tsx">
          <CardTitle data-id="p34mbb747" data-path="src/pages/LeaveManagement.tsx">My Leave Requests</CardTitle>
          <CardDescription data-id="sf6pro3jt" data-path="src/pages/LeaveManagement.tsx">
            Track your leave request history and status
          </CardDescription>
        </CardHeader>
        <CardContent data-id="j9udllfh2" data-path="src/pages/LeaveManagement.tsx">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            {/* First row: Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reason or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Second row: Date, Status, Type filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select 
                value={dateFilter} 
                onValueChange={(v) => {
                  setDateFilter(v as any);
                  if (v !== 'custom') {
                    setCustomStartDate(undefined);
                    setCustomEndDate(undefined);
                    setCustomSingleDate(undefined);
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
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

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CASUAL">Casual Leave</SelectItem>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="VACATION">Vacation</SelectItem>
                  <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                  <SelectItem value="PERSONAL">Personal Leave</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <Select 
                    value={customDateType} 
                    onValueChange={(v) => {
                      setCustomDateType(v as 'range' | 'single');
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                      setCustomSingleDate(undefined);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">Range</SelectItem>
                      <SelectItem value="single">Single Date</SelectItem>
                    </SelectContent>
                  </Select>

                  {customDateType === 'single' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full sm:w-[240px] justify-start text-left font-normal ${!customSingleDate && 'text-muted-foreground'}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customSingleDate ? format(customSingleDate, 'PPP') : 'Pick a date'}
                          {customSingleDate && (
                            <X
                              className="ml-auto h-4 w-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomSingleDate(undefined);
                              }}
                            />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customSingleDate}
                          onSelect={setCustomSingleDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full sm:w-[240px] justify-start text-left font-normal ${!customStartDate && 'text-muted-foreground'}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customStartDate ? format(customStartDate, 'PPP') : 'Start date'}
                            {customStartDate && (
                              <X
                                className="ml-auto h-4 w-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomStartDate(undefined);
                                }}
                              />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customStartDate}
                            onSelect={setCustomStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full sm:w-[240px] justify-start text-left font-normal ${!customEndDate && 'text-muted-foreground'}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, 'PPP') : 'End date'}
                            {customEndDate && (
                              <X
                                className="ml-auto h-4 w-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomEndDate(undefined);
                                }}
                              />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            disabled={(date) => customStartDate ? date < customStartDate : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <Table data-id="dfdgdssx6" data-path="src/pages/LeaveManagement.tsx">
            <TableHeader data-id="a05syyzv3" data-path="src/pages/LeaveManagement.tsx">
              <TableRow data-id="z6wt21qb0" data-path="src/pages/LeaveManagement.tsx">
                <TableHead data-id="zo3fl877y" data-path="src/pages/LeaveManagement.tsx">Type</TableHead>
                <TableHead data-id="za6qnrf2j" data-path="src/pages/LeaveManagement.tsx">Period</TableHead>
                <TableHead data-id="xc4mn810v" data-path="src/pages/LeaveManagement.tsx">Days</TableHead>
                <TableHead data-id="xyvfadbic" data-path="src/pages/LeaveManagement.tsx">Status</TableHead>
                <TableHead data-id="baeh3xuvo" data-path="src/pages/LeaveManagement.tsx">Applied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    {searchTerm || dateFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' 
                      ? 'No leave requests found matching your filters.' 
                      : 'No leave requests found. Click "Apply Leave" to submit your first request.'}
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {getLeaveTypeLabel(request.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(request.startDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">to {new Date(request.endDate).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
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
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRequest(request)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(request)}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Leave Policy */}
      <Card data-id="j1d979v55" data-path="src/pages/LeaveManagement.tsx">
        <CardHeader data-id="eon3nbqin" data-path="src/pages/LeaveManagement.tsx">
          <CardTitle data-id="7k6107jrl" data-path="src/pages/LeaveManagement.tsx">Leave Policy</CardTitle>
          <CardDescription data-id="7zbhgm9t0" data-path="src/pages/LeaveManagement.tsx">Company leave policies and guidelines</CardDescription>
        </CardHeader>
        <CardContent data-id="5p52w1bvc" data-path="src/pages/LeaveManagement.tsx">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-id="22j4yw24r" data-path="src/pages/LeaveManagement.tsx">
            <div data-id="zf59w302v" data-path="src/pages/LeaveManagement.tsx">
              <h4 className="font-semibold mb-3" data-id="29hwrcoy7" data-path="src/pages/LeaveManagement.tsx">Leave Types</h4>
              <div className="space-y-3">
                {leaveTypes.map((type) => {
                  let days = 0;
                  if (balance) {
                    switch (type.value) {
                      case 'CASUAL': days = balance.casualLeave; break;
                      case 'SICK': days = balance.sickLeave; break;
                      case 'VACATION': days = balance.vacationLeave; break;
                      case 'PERSONAL': days = balance.personalLeave; break;
                    }
                  }
                  return (
                    <div key={type.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{type.label}</span>
                      <Badge variant="secondary">
                        {days} days/year
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div data-id="aebpevy5z" data-path="src/pages/LeaveManagement.tsx">
              <h4 className="font-semibold mb-3" data-id="0mzytt8fi" data-path="src/pages/LeaveManagement.tsx">Important Notes</h4>
              <div className="space-y-2 text-sm text-gray-600" data-id="r6hel4acm" data-path="src/pages/LeaveManagement.tsx">
                <p data-id="742jwdkgw" data-path="src/pages/LeaveManagement.tsx">ΓÇó Leave requests must be submitted at least 2 days in advance</p>
                <p data-id="zhf3ga3o5" data-path="src/pages/LeaveManagement.tsx">ΓÇó Sick leave requires medical certificate for more than 3 days</p>
                <p data-id="h06hdssk6" data-path="src/pages/LeaveManagement.tsx">ΓÇó Vacation leave requires manager approval</p>
                <p data-id="s6i86xsx9" data-path="src/pages/LeaveManagement.tsx">ΓÇó Unused casual leave can be carried forward up to 5 days</p>
                <p data-id="ezmu63dsd" data-path="src/pages/LeaveManagement.tsx">ΓÇó Maternity leave is as per company policy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Leave Request Dialog */}
      {selectedRequest && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
              <DialogDescription>
                View details of your leave request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Leave Type</Label>
                  <p className="font-medium">{getLeaveTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="font-medium">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="font-medium">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Days</Label>
                  <p className="font-medium">{selectedRequest.days} day(s)</p>
                </div>
                <div>
                  <Label>Applied Date</Label>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.approver && (
                <div>
                  <Label>Approved/Rejected By</Label>
                  <p className="font-medium">{selectedRequest.approver.firstName} {selectedRequest.approver.lastName}</p>
                  {selectedRequest.approvedAt && (
                    <p className="text-sm text-gray-500">{new Date(selectedRequest.approvedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
              {selectedRequest.rejectionReason && (
                <div>
                  <Label>Rejection Reason / Comment</Label>
                  <p className="text-sm bg-red-50 p-3 rounded-lg mt-1">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              {selectedRequest.status === 'PENDING' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditRequest(selectedRequest);
                  }}
                >
                  Edit Request
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Leave Request Dialog */}
      {selectedRequest && (
        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setError(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Leave Request</DialogTitle>
              <DialogDescription>
                Update your leave request details
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
                <Label htmlFor="edit-leaveType">Leave Type</Label>
                <Select
                  value={editForm.leaveType}
                  onValueChange={(value) => setEditForm({ ...editForm, leaveType: value as LeaveType })}
                >
                  <SelectTrigger id="edit-leaveType">
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
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    min={editForm.startDate || new Date().toISOString().split('T')[0]}
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
                  checked={editForm.halfDay}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, halfDay: checked })}
                />
              </div>

              {editForm.startDate && editForm.endDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Available Days</Label>
                    <p className="text-lg font-semibold text-green-600">{editAvailableDays.toFixed(1)}</p>
                  </div>
                  <div>
                    <Label>Requested Days</Label>
                    <p className="text-lg font-semibold">{calculateEditDays().toFixed(1)}</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="edit-reason">Reason</Label>
                <Textarea
                  id="edit-reason"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for your leave request..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
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
              <p className="text-sm text-gray-600">
                <strong>Leave Type:</strong> {getLeaveTypeLabel(requestToDelete.type)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Period:</strong> {new Date(requestToDelete.startDate).toLocaleDateString()} - {new Date(requestToDelete.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Days:</strong> {requestToDelete.days}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

};

export default LeaveManagement;
