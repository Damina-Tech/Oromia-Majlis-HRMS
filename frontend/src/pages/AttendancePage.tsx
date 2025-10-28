import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  checkIn,
  checkOut,
  getTodayStatus,
  getAttendanceStats,
  listAttendance,
  type Attendance,
  type AttendanceStats,
} from '@/services/attendance';
import { Building2, MapPinned } from 'lucide-react';
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Play,
  Square,
  Loader2,
} from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workTimer, setWorkTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const employeeId = user?.employeeId;

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo purposes, we'll just show coordinates
          // In real app, you'd reverse geocode to get address
          setCurrentLocation(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
        },
        (error) => {
          setCurrentLocation('Location access denied');
        }
      );
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (employeeId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [employeeId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && todayAttendance?.checkInTime) {
      // Calculate elapsed time from check-in
      const checkInTime = new Date(todayAttendance.checkInTime).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - checkInTime) / 1000);
        setWorkTimer(elapsed);
      };
      
      updateTimer(); // Initial update
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, todayAttendance]);

  const loadData = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [today, history, statistics] = await Promise.all([
        getTodayStatus(),
        listAttendance({ page: 1, pageSize: 10 }),
        getAttendanceStats(),
      ]);

      setTodayAttendance(today);
      setAttendanceHistory(history.items);
      setStats(statistics);

      // Start timer if checked in but not checked out
      if (today && today.checkInTime && !today.checkOutTime) {
        setIsTimerRunning(true);
      }
    } catch (err) {
      console.error('Load data error:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    if (!currentLocation || currentLocation === 'Location access denied') {
      toast.error('Please allow location access to check in');
      return;
    }

    try {
      setSubmitting(true);
      const attendance = await checkIn(currentLocation);
      setTodayAttendance(attendance);
      setIsTimerRunning(true);
      toast.success(`Checked in successfully at ${new Date(attendance.checkInTime!).toLocaleTimeString()}`);
      await loadData(); // Reload to update stats
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to check in';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentLocation || currentLocation === 'Location access denied') {
      toast.error('Please allow location access to check out');
      return;
    }

    try {
      setSubmitting(true);
      const attendance = await checkOut(currentLocation);
      setTodayAttendance(attendance);
      setIsTimerRunning(false);
      toast.success(`Checked out successfully. Total work time: ${formatTime(workTimer)}`);
      await loadData(); // Reload to update stats
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to check out';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      case 'HALF_DAY':
        return 'bg-blue-100 text-blue-800';
      case 'ON_LEAVE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LATE':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
                  Please log out and log back in to access the attendance system.
                </p>
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

  const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-1">Track and manage attendance with GPS verification</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Status</p>
                <p className="text-lg font-bold text-green-600">
                  {isCheckedIn ? 'Checked In' : todayAttendance?.checkOutTime ? 'Checked Out' : 'Not Checked In'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Work Hours Today</p>
                <p className="text-lg font-bold">
                  {todayAttendance?.workHours
                    ? `${parseFloat(todayAttendance.workHours.toString()).toFixed(2)}h`
                    : formatTime(workTimer)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-lg font-bold">{stats?.totalDays || 0} Days</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Location</p>
                <p className="text-sm font-medium truncate">
                  {todayAttendance?.checkInLocationInfo?.displayName || currentLocation || 'Loading...'}
                </p>
                {todayAttendance?.checkInLocationInfo?.isOffice && (
                  <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                    <Building2 className="h-3 w-3 mr-1" />
                    Office
                  </Badge>
                )}
              </div>
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check In/Out Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>GPS Attendance</CardTitle>
            <CardDescription>Check in/out with location verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Current Status</h3>
                  <p className="text-sm text-gray-600">
                    {isCheckedIn
                      ? `Checked in at ${new Date(todayAttendance.checkInTime!).toLocaleTimeString()}`
                      : todayAttendance?.checkOutTime
                      ? `Checked out at ${new Date(todayAttendance.checkOutTime).toLocaleTimeString()}`
                      : 'Not checked in today'}
                  </p>
                </div>
                <Badge className={isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {isCheckedIn ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Timer Display */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Work Timer</p>
                  <p className="text-3xl font-mono font-bold text-blue-600">{formatTime(workTimer)}</p>
                  <div className="flex items-center justify-center mt-2">
                    {isTimerRunning ? (
                      <div className="flex items-center text-green-600">
                        <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
                        Timer Running
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-600">
                        <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                        Timer Stopped
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    GPS: {currentLocation || 'Detecting...'}
                  </span>
                </div>
                {todayAttendance?.checkInLocationInfo && (
                  <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-lg">
                    {todayAttendance.checkInLocationInfo.isOffice ? (
                      <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                    ) : (
                      <MapPinned className="h-4 w-4 text-orange-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {todayAttendance.checkInLocationInfo.displayName}
                      </p>
                      {todayAttendance.checkInLocationInfo.isOffice && (
                        <p className="text-xs text-gray-600 mt-1">
                          {todayAttendance.checkInLocationInfo.distanceMeters !== undefined && 
                            `${todayAttendance.checkInLocationInfo.distanceMeters}m from office center`
                          }
                        </p>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`mt-1 text-xs ${
                          todayAttendance.checkInLocationInfo.isOffice 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {todayAttendance.checkInLocationInfo.isOffice ? 'At Office' : 'Remote Work'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {!isCheckedIn && !todayAttendance?.checkOutTime ? (
                  <Button
                    onClick={handleCheckIn}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!currentLocation || currentLocation === 'Location access denied' || submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Check In
                  </Button>
                ) : isCheckedIn ? (
                  <Button onClick={handleCheckOut} variant="destructive" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                    Check Out
                  </Button>
                ) : (
                  <Alert>
                    <AlertDescription>You have already checked out for today.</AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCurrentLocation(
                            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
                          );
                          toast.success('Location refreshed');
                        },
                        (error) => {
                          setCurrentLocation('Location access denied');
                          toast.error('Failed to get location');
                        }
                      );
                    }
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Refresh Location
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>View attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Location Type</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{record.workHours ? `${parseFloat(record.workHours.toString()).toFixed(2)}h` : '0h'}</TableCell>
                    <TableCell>
                      {(record as any).checkInLocationInfo ? (
                        <div className="flex items-center space-x-1">
                          {(record as any).checkInLocationInfo.isOffice ? (
                            <>
                              <Building2 className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">Office</span>
                            </>
                          ) : (
                            <>
                              <MapPinned className="h-3 w-3 text-orange-600" />
                              <span className="text-xs text-orange-700 font-medium">Remote</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {(record as any).checkInLocationInfo?.displayName || record.checkInLocation || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Statistics</CardTitle>
            <CardDescription>Your attendance summary for this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lateDays}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Half Day</p>
                <p className="text-2xl font-bold text-blue-600">{stats.halfDays}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">On Leave</p>
                <p className="text-2xl font-bold text-purple-600">{stats.onLeaveDays}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalWorkHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendancePage;
