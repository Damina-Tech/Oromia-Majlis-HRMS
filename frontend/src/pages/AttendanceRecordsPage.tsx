import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  listAttendance,
  createAttendanceRecord,
  updateAttendance,
  deleteAttendance,
  type Attendance,
  type AttendanceStatus,
} from '@/services/attendance';
import { listEmployees, type Employee } from '@/services/employees';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  MapPinned,
} from 'lucide-react';
import { format } from 'date-fns';

const AttendanceRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  
  // Only ADMIN and MANAGER can access this page
  const isAdminOrManager = user?.roles?.some(role => 
    role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'MANAGER'
  ) || false;
  
  const canManage = isAdminOrManager && (hasPermission('attendance.manage') || hasPermission('attendance.read'));
  const canCreate = isAdminOrManager && (hasPermission('attendance.manage') || hasPermission('attendance.read'));

  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'checkInTime' | 'checkOutTime' | 'status' | 'createdAt'>('date');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<Attendance | null>(null);

  // Form states for edit
  const [editForm, setEditForm] = useState({
    status: '' as AttendanceStatus | '',
    checkInTime: '',
    checkOutTime: '',
    checkInLocation: '',
    checkOutLocation: '',
    notes: '',
  });

  // Form states for add
  const [addForm, setAddForm] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: '',
    checkOutTime: '',
    checkInLocation: '',
    checkOutLocation: '',
    status: 'PRESENT' as AttendanceStatus,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load data
  useEffect(() => {
    loadData();
    if (canCreate) {
      loadEmployees();
    }
  }, [page, pageSize, statusFilter, sortBy, canManage, canCreate]);

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

  const loadEmployees = async () => {
    try {
      const response = await listEmployees({ page: 1, pageSize: 1000, status: 'ACTIVE' });
      setEmployees(response.items);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await listAttendance({
        allEmployees: canManage ? true : false, // Show all employees if user has permission
        status: statusFilter !== 'all' ? statusFilter as AttendanceStatus : undefined,
        search: searchTerm || undefined,
        sortBy,
        sortOrder: 'desc',
        page,
        pageSize,
      });
      setRecords(response.items);
      setTotal(response.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record: Attendance) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleAddRecord = () => {
    setAddForm({
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      checkInTime: '',
      checkOutTime: '',
      checkInLocation: '',
      checkOutLocation: '',
      status: 'PRESENT',
      notes: '',
    });
    setError('');
    setShowAddDialog(true);
  };

  const handleSaveAdd = async () => {
    if (!addForm.employeeId || !addForm.date) {
      setError('Please select employee and date');
      return;
    }

    if (!addForm.checkInTime && !addForm.checkOutTime) {
      setError('Please provide at least check-in or check-out time');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Format check-in and check-out times properly
      let checkInDateTime = addForm.checkInTime || undefined;
      let checkOutDateTime = addForm.checkOutTime || undefined;
      
      if (checkInDateTime && !checkInDateTime.includes('T')) {
        checkInDateTime = `${addForm.date}T${checkInDateTime}`;
      }
      if (checkOutDateTime && !checkOutDateTime.includes('T')) {
        checkOutDateTime = `${addForm.date}T${checkOutDateTime}`;
      }

      await createAttendanceRecord({
        employeeId: addForm.employeeId,
        date: addForm.date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        checkInLocation: addForm.checkInLocation || undefined,
        checkOutLocation: addForm.checkOutLocation || undefined,
        status: addForm.status,
        notes: addForm.notes || undefined,
      });
      
      toast.success('Attendance record created successfully!');
      setShowAddDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create attendance record';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRecord = (record: Attendance) => {
    setSelectedRecord(record);
    setEditForm({
      status: record.status,
      checkInTime: record.checkInTime ? format(new Date(record.checkInTime), "yyyy-MM-dd'T'HH:mm") : '',
      checkOutTime: record.checkOutTime ? format(new Date(record.checkOutTime), "yyyy-MM-dd'T'HH:mm") : '',
      checkInLocation: record.checkInLocation || '',
      checkOutLocation: record.checkOutLocation || '',
      notes: record.notes || '',
    });
    setError('');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    if (!editForm.status) {
      setError('Please select a status');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // Format check-in and check-out times properly
      let checkInDateTime = editForm.checkInTime || undefined;
      let checkOutDateTime = editForm.checkOutTime || undefined;
      
      if (selectedRecord.date && checkInDateTime && !checkInDateTime.includes('T')) {
        checkInDateTime = `${format(new Date(selectedRecord.date), 'yyyy-MM-dd')}T${checkInDateTime}`;
      }
      if (selectedRecord.date && checkOutDateTime && !checkOutDateTime.includes('T')) {
        checkOutDateTime = `${format(new Date(selectedRecord.date), 'yyyy-MM-dd')}T${checkOutDateTime}`;
      }

      await updateAttendance(selectedRecord.id, {
        status: editForm.status,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        checkInLocation: editForm.checkInLocation || undefined,
        checkOutLocation: editForm.checkOutLocation || undefined,
        notes: editForm.notes || undefined,
      });
      toast.success('Attendance record updated successfully!');
      setShowEditDialog(false);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update attendance record';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (record: Attendance) => {
    setRecordToDelete(record);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await deleteAttendance(recordToDelete.id);
      toast.success('Attendance record deleted successfully!');
      setShowDeleteDialog(false);
      setRecordToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete attendance record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HALF_DAY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ON_LEAVE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'LATE':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (checkInTime?: string, checkOutTime?: string) => {
    if (!checkInTime || !checkOutTime) return '-';
    const start = new Date(checkInTime);
    const end = new Date(checkOutTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-1">View and manage employee attendance records</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate('/attendance')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Check In/Out
          </Button>
          {canCreate && (
            <Button 
              variant="outline" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAddRecord}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
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
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="checkInTime">Check In</SelectItem>
                <SelectItem value="checkOutTime">Check Out</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="createdAt">Created At</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
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
                      <TableHead>EMPLOYEE</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>CHECK IN</TableHead>
                      <TableHead>CHECK OUT</TableHead>
                      <TableHead>DURATION</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LOCATION</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                  {getInitials(record.employee.firstName, record.employee.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{record.employee.firstName} {record.employee.lastName}</p>
                                <p className="text-sm text-gray-500">{record.employee.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {record.checkInTime ? format(new Date(record.checkInTime), 'MMM dd, yyyy, h:mm a') : '-'}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime ? format(new Date(record.checkOutTime), 'MMM dd, yyyy, h:mm a') : '-'}
                          </TableCell>
                          <TableCell>
                            {record.workHours ? `${parseFloat(record.workHours.toString()).toFixed(1)}h` : formatDuration(record.checkInTime, record.checkOutTime)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusIcon(record.status)}
                              <span className="ml-1">{record.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              {(record.checkInLocationInfo || record.checkInLocation) && (
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <span className="font-medium text-green-600">In:</span>
                                  <div className="flex items-center space-x-1">
                                    {record.checkInLocationInfo?.isOffice ? (
                                      <Building2 className="h-3 w-3 text-green-600" />
                                    ) : record.checkInLocationInfo && (
                                      <MapPinned className="h-3 w-3 text-orange-600" />
                                    )}
                                    <span className="text-gray-700">
                                      {record.checkInLocationInfo?.displayName || 
                                       (record.checkInLocation && record.checkInLocation.length > 25 ? 
                                        `${record.checkInLocation.substring(0, 25)}...` : 
                                        record.checkInLocation) ||
                                       '-'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {(record.checkOutLocationInfo || record.checkOutLocation) && (
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <span className="font-medium text-red-600">Out:</span>
                                  <div className="flex items-center space-x-1">
                                    {record.checkOutLocationInfo?.isOffice ? (
                                      <Building2 className="h-3 w-3 text-green-600" />
                                    ) : record.checkOutLocationInfo && (
                                      <MapPinned className="h-3 w-3 text-orange-600" />
                                    )}
                                    <span className="text-gray-700">
                                      {record.checkOutLocationInfo?.displayName || 
                                       (record.checkOutLocation && record.checkOutLocation.length > 25 ? 
                                        `${record.checkOutLocation.substring(0, 25)}...` : 
                                        record.checkOutLocation) ||
                                       '-'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {!record.checkInLocationInfo && !record.checkInLocation && 
                               !record.checkOutLocationInfo && !record.checkOutLocation && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewRecord(record)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManage && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditRecord(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(record)}
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
                      &lt;&lt;
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
                      &gt;&gt;
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Attendance Record Dialog */}
      {selectedRecord && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Attendance Record Details</DialogTitle>
              <DialogDescription>
                {selectedRecord.employee.firstName} {selectedRecord.employee.lastName} - {format(new Date(selectedRecord.date), 'dd/MM/yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="font-medium">{selectedRecord.employee.firstName} {selectedRecord.employee.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedRecord.employee.email}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{format(new Date(selectedRecord.date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label>Check In</Label>
                  <p className="font-medium">{selectedRecord.checkInTime ? format(new Date(selectedRecord.checkInTime), 'MMM dd, yyyy, h:mm a') : '-'}</p>
                </div>
                <div>
                  <Label>Check Out</Label>
                  <p className="font-medium">{selectedRecord.checkOutTime ? format(new Date(selectedRecord.checkOutTime), 'MMM dd, yyyy, h:mm a') : '-'}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="font-medium">
                    {selectedRecord.workHours ? `${parseFloat(selectedRecord.workHours.toString()).toFixed(1)}h` : formatDuration(selectedRecord.checkInTime, selectedRecord.checkOutTime)}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status}
                  </Badge>
                </div>
                {(selectedRecord.checkInLocationInfo || selectedRecord.checkInLocation) && (
                  <div>
                    <Label>Check In Location</Label>
                    <div className="flex items-start space-x-2">
                      {selectedRecord.checkInLocationInfo?.isOffice ? (
                        <Building2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : selectedRecord.checkInLocationInfo && (
                        <MapPinned className="h-4 w-4 text-orange-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {selectedRecord.checkInLocationInfo?.displayName || selectedRecord.checkInLocation}
                        </p>
                        {selectedRecord.checkInLocationInfo?.isOffice && selectedRecord.checkInLocationInfo?.distanceMeters !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedRecord.checkInLocationInfo.distanceMeters}m from office center
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {(selectedRecord.checkOutLocationInfo || selectedRecord.checkOutLocation) && (
                  <div>
                    <Label>Check Out Location</Label>
                    <div className="flex items-start space-x-2">
                      {selectedRecord.checkOutLocationInfo?.isOffice ? (
                        <Building2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : selectedRecord.checkOutLocationInfo && (
                        <MapPinned className="h-4 w-4 text-orange-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {selectedRecord.checkOutLocationInfo?.displayName || selectedRecord.checkOutLocation}
                        </p>
                        {selectedRecord.checkOutLocationInfo?.isOffice && selectedRecord.checkOutLocationInfo?.distanceMeters !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedRecord.checkOutLocationInfo.distanceMeters}m from office center
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedRecord.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditRecord(selectedRecord);
                  }}
                >
                  Edit Record
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Attendance Record Dialog */}
      {selectedRecord && (
        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setError(''); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Attendance Record</DialogTitle>
              <DialogDescription>
                Update attendance information for {selectedRecord.employee.firstName} {selectedRecord.employee.lastName}
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
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value as AttendanceStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-checkInTime">Check In Time</Label>
                  <Input
                    id="edit-checkInTime"
                    type="datetime-local"
                    value={editForm.checkInTime}
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-checkOutTime">Check Out Time</Label>
                  <Input
                    id="edit-checkOutTime"
                    type="datetime-local"
                    value={editForm.checkOutTime}
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-checkInLocation">Check In Location</Label>
                  <Input
                    id="edit-checkInLocation"
                    value={editForm.checkInLocation}
                    onChange={(e) => setEditForm({ ...editForm, checkInLocation: e.target.value })}
                    placeholder="e.g., Office, Remote"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-checkOutLocation">Check Out Location</Label>
                  <Input
                    id="edit-checkOutLocation"
                    value={editForm.checkOutLocation}
                    onChange={(e) => setEditForm({ ...editForm, checkOutLocation: e.target.value })}
                    placeholder="e.g., Office, Remote"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Attendance Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setError(''); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
            <DialogDescription>
              Create a new attendance record for an employee
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
              <Label htmlFor="add-employee">Employee *</Label>
              <Select
                value={addForm.employeeId}
                onValueChange={(value) => setAddForm({ ...addForm, employeeId: value })}
              >
                <SelectTrigger id="add-employee">
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

            <div>
              <Label htmlFor="add-date">Date *</Label>
              <Input
                id="add-date"
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <Label htmlFor="add-status">Status *</Label>
              <Select
                value={addForm.status}
                onValueChange={(value) => setAddForm({ ...addForm, status: value as AttendanceStatus })}
              >
                <SelectTrigger id="add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-checkInTime">Check In Time</Label>
                <Input
                  id="add-checkInTime"
                  type="datetime-local"
                  value={addForm.checkInTime}
                  onChange={(e) => setAddForm({ ...addForm, checkInTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-checkOutTime">Check Out Time</Label>
                <Input
                  id="add-checkOutTime"
                  type="datetime-local"
                  value={addForm.checkOutTime}
                  onChange={(e) => setAddForm({ ...addForm, checkOutTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-checkInLocation">Check In Location</Label>
                <Input
                  id="add-checkInLocation"
                  value={addForm.checkInLocation}
                  onChange={(e) => setAddForm({ ...addForm, checkInLocation: e.target.value })}
                  placeholder="e.g., Office, Remote"
                />
              </div>
              <div>
                <Label htmlFor="add-checkOutLocation">Check Out Location</Label>
                <Input
                  id="add-checkOutLocation"
                  value={addForm.checkOutLocation}
                  onChange={(e) => setAddForm({ ...addForm, checkOutLocation: e.target.value })}
                  placeholder="e.g., Office, Remote"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdd} disabled={submitting} className="bg-purple-600 hover:bg-purple-700">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {recordToDelete && (
            <div className="space-y-2">
              <p className="text-sm"><strong>Employee:</strong> {recordToDelete.employee.firstName} {recordToDelete.employee.lastName}</p>
              <p className="text-sm"><strong>Date:</strong> {format(new Date(recordToDelete.date), 'dd/MM/yyyy')}</p>
              <p className="text-sm"><strong>Status:</strong> {recordToDelete.status}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setRecordToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceRecordsPage;

