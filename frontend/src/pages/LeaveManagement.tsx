import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
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
import { toast } from '@/hooks/use-toast';
import { mockLeaveRequests } from '@/services/mockData';
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  FileText,
  AlertCircle } from
'lucide-react';

const LeaveManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');

  const leaveTypes = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'personal', label: 'Personal Leave' }];


  const leaveBalance = {
    casual: 12,
    sick: 10,
    vacation: 21,
    personal: 5
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = () => {
    if (!leaveType || !startDate || !endDate || !reason) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields.",
        variant: "destructive"
      });
      return;
    }

    const days = calculateDays();

    toast({
      title: "Leave Request Submitted",
      description: `Your ${leaveType} leave request for ${days} day(s) has been submitted for approval.`
    });

    // Reset form
    setLeaveType('');
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setIsDialogOpen(false);
  };

  const handleApprove = (id: string) => {
    toast({
      title: "Leave Approved",
      description: "Leave request has been approved successfully."
    });
  };

  const handleReject = (id: string) => {
    toast({
      title: "Leave Rejected",
      description: "Leave request has been rejected.",
      variant: "destructive"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':return 'bg-green-100 text-green-800';
      case 'rejected':return 'bg-red-100 text-red-800';
      case 'pending':return 'bg-yellow-100 text-yellow-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':return <Check className="h-4 w-4" data-id="veasid8p9" data-path="src/pages/LeaveManagement.tsx" />;
      case 'rejected':return <X className="h-4 w-4" data-id="vdi1631hg" data-path="src/pages/LeaveManagement.tsx" />;
      case 'pending':return <Clock className="h-4 w-4" data-id="rx2twnuxd" data-path="src/pages/LeaveManagement.tsx" />;
      default:return <AlertCircle className="h-4 w-4" data-id="hyb60cr0q" data-path="src/pages/LeaveManagement.tsx" />;
    }
  };

  return (
    <div className="space-y-6" data-id="zkkmwkm6i" data-path="src/pages/LeaveManagement.tsx">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-id="agjo5yvol" data-path="src/pages/LeaveManagement.tsx">
        <div data-id="t7wl3eexj" data-path="src/pages/LeaveManagement.tsx">
          <h1 className="text-3xl font-bold text-gray-900" data-id="wofyxd5jv" data-path="src/pages/LeaveManagement.tsx">Leave Management</h1>
          <p className="text-gray-600 mt-1" data-id="gttztqm8g" data-path="src/pages/LeaveManagement.tsx">Apply for leave and track your requests</p>
        </div>
        
        {hasPermission('leave.apply') &&
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} data-id="hmyfie3xi" data-path="src/pages/LeaveManagement.tsx">
            <DialogTrigger asChild data-id="7i6we9vov" data-path="src/pages/LeaveManagement.tsx">
              <Button data-id="810gjocij" data-path="src/pages/LeaveManagement.tsx">
                <Plus className="h-4 w-4 mr-2" data-id="grbiziqib" data-path="src/pages/LeaveManagement.tsx" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-id="vly6pk55l" data-path="src/pages/LeaveManagement.tsx">
              <DialogHeader data-id="vj9aqdtgg" data-path="src/pages/LeaveManagement.tsx">
                <DialogTitle data-id="de8szh2ic" data-path="src/pages/LeaveManagement.tsx">Apply for Leave</DialogTitle>
                <DialogDescription data-id="3c0jrezbm" data-path="src/pages/LeaveManagement.tsx">
                  Submit a new leave request for approval
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 py-4" data-id="sbl526ukd" data-path="src/pages/LeaveManagement.tsx">
                <div className="space-y-4" data-id="9n8q3eis0" data-path="src/pages/LeaveManagement.tsx">
                  <div data-id="dj7jr578y" data-path="src/pages/LeaveManagement.tsx">
                    <Label htmlFor="leaveType" data-id="2fck4eo94" data-path="src/pages/LeaveManagement.tsx">Leave Type</Label>
                    <Select value={leaveType} onValueChange={setLeaveType} data-id="l7lvd8oeu" data-path="src/pages/LeaveManagement.tsx">
                      <SelectTrigger data-id="jf7s9w72w" data-path="src/pages/LeaveManagement.tsx">
                        <SelectValue placeholder="Select leave type" data-id="lh4ztlrcw" data-path="src/pages/LeaveManagement.tsx" />
                      </SelectTrigger>
                      <SelectContent data-id="p0hvepsw9" data-path="src/pages/LeaveManagement.tsx">
                        {leaveTypes.map((type) =>
                      <SelectItem key={type.value} value={type.value} data-id="5ksibc4gh" data-path="src/pages/LeaveManagement.tsx">
                            {type.label}
                          </SelectItem>
                      )}
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

                <div className="flex justify-end space-x-3" data-id="uncsq03vr" data-path="src/pages/LeaveManagement.tsx">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-id="tbaan6e9w" data-path="src/pages/LeaveManagement.tsx">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} data-id="i4lq8ijmo" data-path="src/pages/LeaveManagement.tsx">
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-id="wzoo0nz24" data-path="src/pages/LeaveManagement.tsx">
        {Object.entries(leaveBalance).map(([type, balance]) =>
        <Card key={type} data-id="whxwuixq3" data-path="src/pages/LeaveManagement.tsx">
            <CardContent className="p-6" data-id="48fwfz0xg" data-path="src/pages/LeaveManagement.tsx">
              <div className="flex items-center justify-between" data-id="ug5qpow23" data-path="src/pages/LeaveManagement.tsx">
                <div data-id="r1uxq17oy" data-path="src/pages/LeaveManagement.tsx">
                  <p className="text-sm font-medium text-gray-600 capitalize" data-id="bha1rbzpx" data-path="src/pages/LeaveManagement.tsx">
                    {type} Leave
                  </p>
                  <p className="text-2xl font-bold" data-id="a3dyjhvz6" data-path="src/pages/LeaveManagement.tsx">{balance}</p>
                  <p className="text-xs text-gray-500" data-id="35xsjqd8l" data-path="src/pages/LeaveManagement.tsx">days available</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" data-id="2g8t8n2s7" data-path="src/pages/LeaveManagement.tsx" />
              </div>
            </CardContent>
          </Card>
        )}
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
            <TableBody data-id="qigu0k234" data-path="src/pages/LeaveManagement.tsx">
              {mockLeaveRequests.map((request) =>
              <TableRow key={request.id} data-id="k14723zz9" data-path="src/pages/LeaveManagement.tsx">
                  <TableCell className="font-medium" data-id="7xd2j4yyw" data-path="src/pages/LeaveManagement.tsx">
                    {request.employeeName}
                  </TableCell>
                  <TableCell data-id="getx6pzls" data-path="src/pages/LeaveManagement.tsx">
                    <Badge variant="outline" className="capitalize" data-id="0nqe5bpvf" data-path="src/pages/LeaveManagement.tsx">
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell data-id="233622bgy" data-path="src/pages/LeaveManagement.tsx">
                    <div className="text-sm" data-id="sta0dgk26" data-path="src/pages/LeaveManagement.tsx">
                      <p data-id="i1xfo5s5l" data-path="src/pages/LeaveManagement.tsx">{new Date(request.startDate).toLocaleDateString()}</p>
                      <p className="text-gray-500" data-id="2u4zyv8hz" data-path="src/pages/LeaveManagement.tsx">to {new Date(request.endDate).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell data-id="z9afudq1f" data-path="src/pages/LeaveManagement.tsx">{request.days}</TableCell>
                  <TableCell data-id="pxxwu5cnw" data-path="src/pages/LeaveManagement.tsx">
                    <div className="flex items-center space-x-2" data-id="auke44d66" data-path="src/pages/LeaveManagement.tsx">
                      {getStatusIcon(request.status)}
                      <Badge className={getStatusColor(request.status)} data-id="91oslyg56" data-path="src/pages/LeaveManagement.tsx">
                        {request.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell data-id="3sgivu6jd" data-path="src/pages/LeaveManagement.tsx">
                    {new Date(request.appliedDate).toLocaleDateString()}
                  </TableCell>
                  {hasPermission('leave.approve') &&
                <TableCell data-id="d4cs9eeru" data-path="src/pages/LeaveManagement.tsx">
                      {request.status === 'pending' &&
                  <div className="flex space-x-2" data-id="6u5aajlbf" data-path="src/pages/LeaveManagement.tsx">
                          <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleApprove(request.id)} data-id="ah7keqt28" data-path="src/pages/LeaveManagement.tsx">

                            <Check className="h-4 w-4" data-id="7fneoyqhk" data-path="src/pages/LeaveManagement.tsx" />
                          </Button>
                          <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleReject(request.id)} data-id="3fhgkxihc" data-path="src/pages/LeaveManagement.tsx">

                            <X className="h-4 w-4" data-id="h1q1ypma1" data-path="src/pages/LeaveManagement.tsx" />
                          </Button>
                        </div>
                  }
                    </TableCell>
                }
                </TableRow>
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
              <div className="space-y-3" data-id="t24nw42bh" data-path="src/pages/LeaveManagement.tsx">
                {leaveTypes.map((type) =>
                <div key={type.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-id="kg1s608qv" data-path="src/pages/LeaveManagement.tsx">
                    <span className="font-medium" data-id="aicp9kjw0" data-path="src/pages/LeaveManagement.tsx">{type.label}</span>
                    <Badge variant="secondary" data-id="95oufs4zp" data-path="src/pages/LeaveManagement.tsx">
                      {leaveBalance[type.value as keyof typeof leaveBalance]} days/year
                    </Badge>
                  </div>
                )}
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