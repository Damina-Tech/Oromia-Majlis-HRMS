import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Users,
  BarChart3 } from
'lucide-react';

const AttendancePage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workTimer, setWorkTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Mock attendance data
  const attendanceData = [
  {
    id: '1',
    date: '2024-12-01',
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    location: 'Office - Main Building',
    workHours: 9,
    breaks: 1
  },
  {
    id: '2',
    date: '2024-12-02',
    checkIn: '09:15',
    checkOut: '18:30',
    status: 'late',
    location: 'Office - Main Building',
    workHours: 9.25,
    breaks: 2
  },
  {
    id: '3',
    date: '2024-12-03',
    checkIn: '',
    checkOut: '',
    status: 'absent',
    location: '',
    workHours: 0,
    breaks: 0
  }];


  const teamAttendance = [
  { name: 'Alice Employee', status: 'present', checkIn: '09:00', location: 'Office' },
  { name: 'Mike Manager', status: 'present', checkIn: '08:45', location: 'Remote' },
  { name: 'Emma Designer', status: 'late', checkIn: '09:30', location: 'Office' },
  { name: 'John Admin', status: 'absent', checkIn: '', location: '' }];


  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo purposes, we'll just show coordinates
          // In real app, you'd reverse geocode to get address
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          setCurrentLocation('Location access denied');
        }
      );
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setWorkTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = () => {
    if (!currentLocation || currentLocation === 'Location access denied') {
      toast({
        title: "Location Required",
        description: "Please allow location access to check in.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    setIsCheckedIn(true);
    setCheckInTime(now.toLocaleTimeString());
    setIsTimerRunning(true);

    toast({
      title: "Checked In Successfully",
      description: `Checked in at ${now.toLocaleTimeString()} from ${currentLocation}`
    });
  };

  const handleCheckOut = () => {
    const now = new Date();
    setIsCheckedIn(false);
    setIsTimerRunning(false);

    toast({
      title: "Checked Out Successfully",
      description: `Checked out at ${now.toLocaleTimeString()}. Total work time: ${formatTime(workTimer)}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':return 'bg-green-100 text-green-800';
      case 'late':return 'bg-yellow-100 text-yellow-800';
      case 'absent':return 'bg-red-100 text-red-800';
      case 'half-day':return 'bg-blue-100 text-blue-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':return <CheckCircle className="h-4 w-4 text-green-600" data-id="a0opoa4pj" data-path="src/pages/AttendancePage.tsx" />;
      case 'late':return <AlertTriangle className="h-4 w-4 text-yellow-600" data-id="m53ky45oy" data-path="src/pages/AttendancePage.tsx" />;
      case 'absent':return <XCircle className="h-4 w-4 text-red-600" data-id="wy2dcdd6d" data-path="src/pages/AttendancePage.tsx" />;
      default:return <Clock className="h-4 w-4 text-gray-600" data-id="rhp5m0omj" data-path="src/pages/AttendancePage.tsx" />;
    }
  };

  return (
    <div className="space-y-6" data-id="mhho75g60" data-path="src/pages/AttendancePage.tsx">
      {/* Page Header */}
      <div data-id="ltwdq6x51" data-path="src/pages/AttendancePage.tsx">
        <h1 className="text-3xl font-bold text-gray-900" data-id="f393kpedo" data-path="src/pages/AttendancePage.tsx">Attendance Management</h1>
        <p className="text-gray-600 mt-1" data-id="lg2sne68e" data-path="src/pages/AttendancePage.tsx">Track and manage attendance with GPS verification</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-id="qusuglpsz" data-path="src/pages/AttendancePage.tsx">
        <Card data-id="1moktb1yc" data-path="src/pages/AttendancePage.tsx">
          <CardContent className="p-6" data-id="a6hj3oawp" data-path="src/pages/AttendancePage.tsx">
            <div className="flex items-center justify-between" data-id="yr2s9ygon" data-path="src/pages/AttendancePage.tsx">
              <div data-id="bhusbwg5o" data-path="src/pages/AttendancePage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="t0juby9fx" data-path="src/pages/AttendancePage.tsx">Today's Status</p>
                <p className="text-lg font-bold text-green-600" data-id="f14pksru1" data-path="src/pages/AttendancePage.tsx">
                  {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" data-id="utp0rt019" data-path="src/pages/AttendancePage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="9nej795dx" data-path="src/pages/AttendancePage.tsx">
          <CardContent className="p-6" data-id="xse54fx3x" data-path="src/pages/AttendancePage.tsx">
            <div className="flex items-center justify-between" data-id="9c9q4mdu0" data-path="src/pages/AttendancePage.tsx">
              <div data-id="l2h5pulvp" data-path="src/pages/AttendancePage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="u6chz9yir" data-path="src/pages/AttendancePage.tsx">Work Hours Today</p>
                <p className="text-lg font-bold" data-id="hycrfuoe7" data-path="src/pages/AttendancePage.tsx">{formatTime(workTimer)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" data-id="mxygqe925" data-path="src/pages/AttendancePage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="ui7nw4ix6" data-path="src/pages/AttendancePage.tsx">
          <CardContent className="p-6" data-id="78xs9zu25" data-path="src/pages/AttendancePage.tsx">
            <div className="flex items-center justify-between" data-id="uqy5p3woe" data-path="src/pages/AttendancePage.tsx">
              <div data-id="1e2myw0a0" data-path="src/pages/AttendancePage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="xp3f9gyqc" data-path="src/pages/AttendancePage.tsx">This Month</p>
                <p className="text-lg font-bold" data-id="b173xc93h" data-path="src/pages/AttendancePage.tsx">22 Days</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-600" data-id="gtfdqk6p9" data-path="src/pages/AttendancePage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="1d52v9ui4" data-path="src/pages/AttendancePage.tsx">
          <CardContent className="p-6" data-id="j0v2vn8j0" data-path="src/pages/AttendancePage.tsx">
            <div className="flex items-center justify-between" data-id="eervhlghi" data-path="src/pages/AttendancePage.tsx">
              <div data-id="t0ozhutty" data-path="src/pages/AttendancePage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="xedhssm6n" data-path="src/pages/AttendancePage.tsx">Current Location</p>
                <p className="text-sm font-medium truncate" data-id="48kva0wyw" data-path="src/pages/AttendancePage.tsx">{currentLocation || 'Loading...'}</p>
              </div>
              <MapPin className="h-8 w-8 text-red-600" data-id="o248hxjbk" data-path="src/pages/AttendancePage.tsx" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-id="m0snvvbv4" data-path="src/pages/AttendancePage.tsx">
        {/* Check In/Out Section */}
        <Card className="lg:col-span-2" data-id="kq1fmwre1" data-path="src/pages/AttendancePage.tsx">
          <CardHeader data-id="ct2ef50i3" data-path="src/pages/AttendancePage.tsx">
            <CardTitle data-id="rd3gy9ml8" data-path="src/pages/AttendancePage.tsx">GPS Attendance</CardTitle>
            <CardDescription data-id="ici5p72kr" data-path="src/pages/AttendancePage.tsx">
              Check in/out with location verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-id="8qouagddw" data-path="src/pages/AttendancePage.tsx">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-6" data-id="fyr4al3j8" data-path="src/pages/AttendancePage.tsx">
              <div className="flex items-center justify-between mb-4" data-id="nmg23p3dw" data-path="src/pages/AttendancePage.tsx">
                <div data-id="68exmn4fr" data-path="src/pages/AttendancePage.tsx">
                  <h3 className="text-lg font-semibold" data-id="1warxus3r" data-path="src/pages/AttendancePage.tsx">Current Status</h3>
                  <p className="text-sm text-gray-600" data-id="vwhxjmtg3" data-path="src/pages/AttendancePage.tsx">
                    {isCheckedIn ? `Checked in at ${checkInTime}` : 'Not checked in today'}
                  </p>
                </div>
                <Badge className={isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} data-id="qsmcodlko" data-path="src/pages/AttendancePage.tsx">
                  {isCheckedIn ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Timer Display */}
              <div className="bg-white rounded-lg p-4 mb-4" data-id="as6ef97h7" data-path="src/pages/AttendancePage.tsx">
                <div className="text-center" data-id="dhsnu5uzm" data-path="src/pages/AttendancePage.tsx">
                  <p className="text-sm text-gray-600 mb-2" data-id="owhi59fmm" data-path="src/pages/AttendancePage.tsx">Work Timer</p>
                  <p className="text-3xl font-mono font-bold text-blue-600" data-id="b9ik3p5g7" data-path="src/pages/AttendancePage.tsx">
                    {formatTime(workTimer)}
                  </p>
                  <div className="flex items-center justify-center mt-2" data-id="50y3g44bz" data-path="src/pages/AttendancePage.tsx">
                    {isTimerRunning ?
                    <div className="flex items-center text-green-600" data-id="zqiin851q" data-path="src/pages/AttendancePage.tsx">
                        <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse mr-2" data-id="xhgcab9sp" data-path="src/pages/AttendancePage.tsx"></div>
                        Timer Running
                      </div> :

                    <div className="flex items-center text-gray-600" data-id="vsq52fy8i" data-path="src/pages/AttendancePage.tsx">
                        <div className="h-2 w-2 bg-gray-400 rounded-full mr-2" data-id="mfy7iosrf" data-path="src/pages/AttendancePage.tsx"></div>
                        Timer Stopped
                      </div>
                    }
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-center space-x-2 mb-4" data-id="4by5tz04h" data-path="src/pages/AttendancePage.tsx">
                <MapPin className="h-4 w-4 text-gray-400" data-id="l6ftapuu9" data-path="src/pages/AttendancePage.tsx" />
                <span className="text-sm text-gray-600" data-id="ngmq22vg2" data-path="src/pages/AttendancePage.tsx">
                  Current Location: {currentLocation || 'Detecting...'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3" data-id="zys2dm95e" data-path="src/pages/AttendancePage.tsx">
                {!isCheckedIn ?
                <Button
                  onClick={handleCheckIn}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!currentLocation || currentLocation === 'Location access denied'} data-id="8vwjaiqfw" data-path="src/pages/AttendancePage.tsx">

                    <Play className="h-4 w-4 mr-2" data-id="21cnkxha3" data-path="src/pages/AttendancePage.tsx" />
                    Check In
                  </Button> :

                <Button
                  onClick={handleCheckOut}
                  variant="destructive"
                  className="flex-1" data-id="gla8bjygq" data-path="src/pages/AttendancePage.tsx">

                    <Square className="h-4 w-4 mr-2" data-id="79yhd8gt2" data-path="src/pages/AttendancePage.tsx" />
                    Check Out
                  </Button>
                }
                
                <Button variant="outline" data-id="5hwydhjh2" data-path="src/pages/AttendancePage.tsx">
                  <MapPin className="h-4 w-4 mr-2" data-id="dtrevuzyr" data-path="src/pages/AttendancePage.tsx" />
                  Refresh Location
                </Button>
              </div>
            </div>

            {/* Break Timer */}
            <div className="bg-blue-50 rounded-lg p-4" data-id="vbh7seau3" data-path="src/pages/AttendancePage.tsx">
              <div className="flex items-center justify-between" data-id="hlx464h6i" data-path="src/pages/AttendancePage.tsx">
                <div data-id="aas3kap7l" data-path="src/pages/AttendancePage.tsx">
                  <h4 className="font-medium" data-id="1yb20jmhy" data-path="src/pages/AttendancePage.tsx">Break Time</h4>
                  <p className="text-sm text-gray-600" data-id="7hwfertah" data-path="src/pages/AttendancePage.tsx">Start/stop break timer</p>
                </div>
                <div className="flex space-x-2" data-id="cowj59opv" data-path="src/pages/AttendancePage.tsx">
                  <Button variant="outline" size="sm" data-id="o0rm7j3bv" data-path="src/pages/AttendancePage.tsx">Start Break</Button>
                  <Button variant="outline" size="sm" disabled data-id="niy3h4013" data-path="src/pages/AttendancePage.tsx">End Break</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card data-id="70r1atht9" data-path="src/pages/AttendancePage.tsx">
          <CardHeader data-id="cza7eehzc" data-path="src/pages/AttendancePage.tsx">
            <CardTitle data-id="v1ldyh2lg" data-path="src/pages/AttendancePage.tsx">Attendance Calendar</CardTitle>
            <CardDescription data-id="4o4dh2qei" data-path="src/pages/AttendancePage.tsx">View attendance history</CardDescription>
          </CardHeader>
          <CardContent data-id="r1tap6izq" data-path="src/pages/AttendancePage.tsx">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border" data-id="x9ywptcmi" data-path="src/pages/AttendancePage.tsx" />

          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card data-id="bn21g1l1h" data-path="src/pages/AttendancePage.tsx">
        <CardHeader data-id="r960hzbwb" data-path="src/pages/AttendancePage.tsx">
          <CardTitle data-id="fnhg6jumh" data-path="src/pages/AttendancePage.tsx">Attendance History</CardTitle>
          <CardDescription data-id="5e5ny0wnm" data-path="src/pages/AttendancePage.tsx">Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent data-id="qj4iq52sg" data-path="src/pages/AttendancePage.tsx">
          <Table data-id="444ntx46f" data-path="src/pages/AttendancePage.tsx">
            <TableHeader data-id="50zw2iube" data-path="src/pages/AttendancePage.tsx">
              <TableRow data-id="3bcxi3mcj" data-path="src/pages/AttendancePage.tsx">
                <TableHead data-id="6mrf85a21" data-path="src/pages/AttendancePage.tsx">Date</TableHead>
                <TableHead data-id="oosn3g8k9" data-path="src/pages/AttendancePage.tsx">Status</TableHead>
                <TableHead data-id="kst5rsfrm" data-path="src/pages/AttendancePage.tsx">Check In</TableHead>
                <TableHead data-id="j7k6tcr90" data-path="src/pages/AttendancePage.tsx">Check Out</TableHead>
                <TableHead data-id="103adlplh" data-path="src/pages/AttendancePage.tsx">Work Hours</TableHead>
                <TableHead data-id="68pje471a" data-path="src/pages/AttendancePage.tsx">Location</TableHead>
                <TableHead data-id="5dyiq45sh" data-path="src/pages/AttendancePage.tsx">Breaks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-id="md78p9s8x" data-path="src/pages/AttendancePage.tsx">
              {attendanceData.map((record) =>
              <TableRow key={record.id} data-id="r7htg6h45" data-path="src/pages/AttendancePage.tsx">
                  <TableCell className="font-medium" data-id="0oypk7ugp" data-path="src/pages/AttendancePage.tsx">
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell data-id="wla58v27k" data-path="src/pages/AttendancePage.tsx">
                    <div className="flex items-center space-x-2" data-id="pkfqaonay" data-path="src/pages/AttendancePage.tsx">
                      {getStatusIcon(record.status)}
                      <Badge className={getStatusColor(record.status)} data-id="jk1dokcj0" data-path="src/pages/AttendancePage.tsx">
                        {record.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell data-id="q0rfeb74l" data-path="src/pages/AttendancePage.tsx">{record.checkIn || '-'}</TableCell>
                  <TableCell data-id="z5mwkmb43" data-path="src/pages/AttendancePage.tsx">{record.checkOut || '-'}</TableCell>
                  <TableCell data-id="woh682127" data-path="src/pages/AttendancePage.tsx">{record.workHours || 0}h</TableCell>
                  <TableCell className="max-w-xs truncate" data-id="ynskwwjiz" data-path="src/pages/AttendancePage.tsx">
                    {record.location || '-'}
                  </TableCell>
                  <TableCell data-id="3t0fof7vm" data-path="src/pages/AttendancePage.tsx">{record.breaks || 0}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Attendance (for managers) */}
      {hasPermission('attendance.view') && user?.role !== 'employee' &&
      <Card data-id="43h6yk1uu" data-path="src/pages/AttendancePage.tsx">
          <CardHeader data-id="d70372i5g" data-path="src/pages/AttendancePage.tsx">
            <CardTitle data-id="lygp0kiq3" data-path="src/pages/AttendancePage.tsx">Team Attendance Today</CardTitle>
            <CardDescription data-id="ej7tj535n" data-path="src/pages/AttendancePage.tsx">Current status of your team members</CardDescription>
          </CardHeader>
          <CardContent data-id="tv9ckogov" data-path="src/pages/AttendancePage.tsx">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-id="6cge29ssl" data-path="src/pages/AttendancePage.tsx">
              {teamAttendance.map((member, index) =>
            <div key={index} className="bg-gray-50 rounded-lg p-4" data-id="7mvzz33m0" data-path="src/pages/AttendancePage.tsx">
                  <div className="flex items-center justify-between mb-2" data-id="khe166xbe" data-path="src/pages/AttendancePage.tsx">
                    <h4 className="font-medium" data-id="igw74ga4f" data-path="src/pages/AttendancePage.tsx">{member.name}</h4>
                    {getStatusIcon(member.status)}
                  </div>
                  <Badge className={getStatusColor(member.status)} data-id="zl8ztrg9o" data-path="src/pages/AttendancePage.tsx">
                    {member.status}
                  </Badge>
                  {member.checkIn &&
              <p className="text-sm text-gray-600 mt-2" data-id="q7rzp6t5o" data-path="src/pages/AttendancePage.tsx">
                      In: {member.checkIn} | {member.location}
                    </p>
              }
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default AttendancePage;