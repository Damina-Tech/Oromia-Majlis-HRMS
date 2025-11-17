import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
  getLeaveBalance,
  type LeaveRequest,
  type LeaveBalance,
  type LeaveType,
} from '@/services/leaves';
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  FileText,
  AlertCircle,
  Loader2 } from
'lucide-react';

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

  const leaveTypes: { value: LeaveType; label: string }[] = [
    { value: 'CASUAL', label: 'Casual Leave' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'VACATION', label: 'Vacation' },
    { value: 'MATERNITY', label: 'Maternity Leave' },
    { value: 'PERSONAL', label: 'Personal Leave' },
  ];

  const employeeId = user?.employeeId;

  // Debug logging
  useEffect(() => {
    console.log('LeaveManagement - User:', user);
    console.log('LeaveManagement - EmployeeId:', employeeId);
  }, [user, employeeId]);

  // Load data on mount
  useEffect(() => {
    if (employeeId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [employeeId]);

  const loadData = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [requests, leaveBalance] = await Promise.all([
        listLeaveRequests({ page: 1, pageSize: 100 }),
        getLeaveBalance(employeeId),
      ]);
      setLeaveRequests(requests.items);
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
          <CardTitle data-id="p34mbb747" data-path="src/pages/LeaveManagement.tsx">Leave Requests</CardTitle>
          <CardDescription data-id="sf6pro3jt" data-path="src/pages/LeaveManagement.tsx">
            {hasPermission('leave.approve') ?
            'Manage leave requests from your team' :
            'Track your leave request status'
            }
          </CardDescription>
        </CardHeader>
        <CardContent data-id="j9udllfh2" data-path="src/pages/LeaveManagement.tsx">
          <Table data-id="dfdgdssx6" data-path="src/pages/LeaveManagement.tsx">
            <TableHeader data-id="a05syyzv3" data-path="src/pages/LeaveManagement.tsx">
              <TableRow data-id="z6wt21qb0" data-path="src/pages/LeaveManagement.tsx">
                <TableHead data-id="y98nq2uc3" data-path="src/pages/LeaveManagement.tsx">Employee</TableHead>
                <TableHead data-id="zo3fl877y" data-path="src/pages/LeaveManagement.tsx">Type</TableHead>
                <TableHead data-id="za6qnrf2j" data-path="src/pages/LeaveManagement.tsx">Period</TableHead>
                <TableHead data-id="xc4mn810v" data-path="src/pages/LeaveManagement.tsx">Days</TableHead>
                <TableHead data-id="xyvfadbic" data-path="src/pages/LeaveManagement.tsx">Status</TableHead>
                <TableHead data-id="baeh3xuvo" data-path="src/pages/LeaveManagement.tsx">Applied Date</TableHead>
                {hasPermission('leave.approve') && <TableHead data-id="uxczbqrwa" data-path="src/pages/LeaveManagement.tsx">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.employee.firstName} {request.employee.lastName}
                    </TableCell>
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
                    {hasPermission('leave.approve') && (
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(request.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReject(request.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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
                <p data-id="742jwdkgw" data-path="src/pages/LeaveManagement.tsx">• Leave requests must be submitted at least 2 days in advance</p>
                <p data-id="zhf3ga3o5" data-path="src/pages/LeaveManagement.tsx">• Sick leave requires medical certificate for more than 3 days</p>
                <p data-id="h06hdssk6" data-path="src/pages/LeaveManagement.tsx">• Vacation leave requires manager approval</p>
                <p data-id="s6i86xsx9" data-path="src/pages/LeaveManagement.tsx">• Unused casual leave can be carried forward up to 5 days</p>
                <p data-id="ezmu63dsd" data-path="src/pages/LeaveManagement.tsx">• Maternity leave is as per company policy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default LeaveManagement;