import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MapPin,
  FileText } from
'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock dashboard data
  const stats = {
    totalEmployees: 156,
    presentToday: 142,
    onLeave: 8,
    pendingApprovals: 12,
    monthlyPayroll: 450000,
    avgWorkHours: 8.2,
    leaveBalance: user?.role === 'employee' ? 15 : null
  };

  const recentActivities = [
  {
    id: 1,
    type: 'leave',
    message: 'Alice Employee applied for vacation leave',
    time: '10 minutes ago',
    status: 'pending'
  },
  {
    id: 2,
    type: 'attendance',
    message: 'Mike Manager checked in at Office',
    time: '25 minutes ago',
    status: 'success'
  },
  {
    id: 3,
    type: 'payroll',
    message: 'November payroll processing completed',
    time: '2 hours ago',
    status: 'success'
  },
  {
    id: 4,
    type: 'expense',
    message: 'Emma Designer submitted travel expense',
    time: '3 hours ago',
    status: 'pending'
  }];


  const upcomingEvents = [
  {
    id: 1,
    title: 'Team Meeting',
    date: '2024-12-15',
    time: '10:00 AM',
    type: 'meeting'
  },
  {
    id: 2,
    title: 'John Admin Birthday',
    date: '2024-12-16',
    time: 'All Day',
    type: 'birthday'
  },
  {
    id: 3,
    title: 'Payroll Processing',
    date: '2024-12-20',
    time: '2:00 PM',
    type: 'payroll'
  }];


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6" data-id="cr58hlqhk" data-path="src/pages/Dashboard.tsx">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white" data-id="00ip1r0i7" data-path="src/pages/Dashboard.tsx">
        <h1 className="text-2xl font-bold mb-2" data-id="qz27enm1n" data-path="src/pages/Dashboard.tsx">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100" data-id="527991n9l" data-path="src/pages/Dashboard.tsx">
          {user?.role === 'employee' ?
          "Here's your personal dashboard overview" :
          "Here's what's happening in your organization today"
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-id="rt6xji74s" data-path="src/pages/Dashboard.tsx">
        {user?.role !== 'employee' &&
        <>
            <Card data-id="z5sk2g3mz" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="q3bsqw0t0" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="gz9hci4x6" data-path="src/pages/Dashboard.tsx">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" data-id="e6buw4uxd" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="m5witi60n" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="th7y8y4ql" data-path="src/pages/Dashboard.tsx">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground" data-id="5m7auliim" data-path="src/pages/Dashboard.tsx">
                  <span className="text-green-600 flex items-center" data-id="7tirgix2g" data-path="src/pages/Dashboard.tsx">
                    <TrendingUp className="h-3 w-3 mr-1" data-id="3abxko0m8" data-path="src/pages/Dashboard.tsx" />
                    +2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card data-id="bc1fqbsbv" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="af1lf94wx" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="g95gm50ds" data-path="src/pages/Dashboard.tsx">Present Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" data-id="vxgvky7kf" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="nr73id1x3" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="icjqp6yuj" data-path="src/pages/Dashboard.tsx">{stats.presentToday}</div>
                <p className="text-xs text-muted-foreground" data-id="q3rilffp2" data-path="src/pages/Dashboard.tsx">
                  {stats.onLeave} employees on leave
                </p>
                <Progress value={stats.presentToday / stats.totalEmployees * 100} className="mt-2" data-id="tk5ioouuf" data-path="src/pages/Dashboard.tsx" />
              </CardContent>
            </Card>

            <Card data-id="kqf5giwrb" data-path="src/pages/Dashboard.tsx">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="5v6wscbs8" data-path="src/pages/Dashboard.tsx">
                <CardTitle className="text-sm font-medium" data-id="fmi5zuw8q" data-path="src/pages/Dashboard.tsx">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" data-id="t52zzd4uh" data-path="src/pages/Dashboard.tsx" />
              </CardHeader>
              <CardContent data-id="n2jaf5od9" data-path="src/pages/Dashboard.tsx">
                <div className="text-2xl font-bold" data-id="ket0vrqbr" data-path="src/pages/Dashboard.tsx">${stats.monthlyPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground" data-id="g4ec8nurf" data-path="src/pages/Dashboard.tsx">
                  <span className="text-red-600 flex items-center" data-id="e257jo86u" data-path="src/pages/Dashboard.tsx">
                    <TrendingDown className="h-3 w-3 mr-1" data-id="hvjo6ceai" data-path="src/pages/Dashboard.tsx" />
                    -1.2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        }

        <Card data-id="gzz7to370" data-path="src/pages/Dashboard.tsx">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-id="dx6798m7o" data-path="src/pages/Dashboard.tsx">
            <CardTitle className="text-sm font-medium" data-id="m66m8f8u7" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? 'Leave Balance' : 'Pending Approvals'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" data-id="x0f35vcjh" data-path="src/pages/Dashboard.tsx" />
          </CardHeader>
          <CardContent data-id="cgmdee7a5" data-path="src/pages/Dashboard.tsx">
            <div className="text-2xl font-bold" data-id="n1pi0sp44" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? stats.leaveBalance : stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground" data-id="4hflcllo6" data-path="src/pages/Dashboard.tsx">
              {user?.role === 'employee' ? 'days available' : 'require attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-id="hrmg3vmzp" data-path="src/pages/Dashboard.tsx">
        {/* Recent Activities */}
        <Card data-id="a7bkyg03f" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="suw1rsq7e" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="abgzy940m" data-path="src/pages/Dashboard.tsx">Recent Activities</CardTitle>
            <CardDescription data-id="lyv8uprk3" data-path="src/pages/Dashboard.tsx">Latest updates across the organization</CardDescription>
          </CardHeader>
          <CardContent data-id="u54wrz1jo" data-path="src/pages/Dashboard.tsx">
            <div className="space-y-4" data-id="4mdxan87z" data-path="src/pages/Dashboard.tsx">
              {recentActivities.map((activity) =>
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-id="7djpb671h" data-path="src/pages/Dashboard.tsx">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`
                } data-id="z8bwc9mh2" data-path="src/pages/Dashboard.tsx" />
                  <div className="flex-1 min-w-0" data-id="y85jit8qt" data-path="src/pages/Dashboard.tsx">
                    <p className="text-sm font-medium text-gray-900" data-id="og4tn82eg" data-path="src/pages/Dashboard.tsx">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500" data-id="73wxynwx6" data-path="src/pages/Dashboard.tsx">{activity.time}</p>
                  </div>
                  <Badge
                  variant={activity.status === 'success' ? 'default' : 'secondary'}
                  className="text-xs" data-id="d26atjxco" data-path="src/pages/Dashboard.tsx">

                    {activity.status}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-id="u9b4f2pum" data-path="src/pages/Dashboard.tsx">
              View All Activities
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card data-id="f86xw1i00" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="1461gmddw" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="6q678rmdo" data-path="src/pages/Dashboard.tsx">Upcoming Events</CardTitle>
            <CardDescription data-id="igkok7l4k" data-path="src/pages/Dashboard.tsx">Don't miss these important dates</CardDescription>
          </CardHeader>
          <CardContent data-id="6szy1kv00" data-path="src/pages/Dashboard.tsx">
            <div className="space-y-4" data-id="xum5xrliv" data-path="src/pages/Dashboard.tsx">
              {upcomingEvents.map((event) =>
              <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-id="rwexdx3p2" data-path="src/pages/Dashboard.tsx">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                event.type === 'meeting' ? 'bg-blue-100 text-blue-600' :
                event.type === 'birthday' ? 'bg-pink-100 text-pink-600' :
                'bg-green-100 text-green-600'}`
                } data-id="3oydhofom" data-path="src/pages/Dashboard.tsx">
                    {event.type === 'meeting' ? <Users className="h-5 w-5" data-id="r9cry2wvi" data-path="src/pages/Dashboard.tsx" /> :
                  event.type === 'birthday' ? <Calendar className="h-5 w-5" data-id="6vpxvtvuu" data-path="src/pages/Dashboard.tsx" /> :
                  <DollarSign className="h-5 w-5" data-id="0vjxps1it" data-path="src/pages/Dashboard.tsx" />}
                  </div>
                  <div className="flex-1 min-w-0" data-id="mymzu6csp" data-path="src/pages/Dashboard.tsx">
                    <p className="text-sm font-medium text-gray-900" data-id="48nivtzpy" data-path="src/pages/Dashboard.tsx">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500" data-id="2wiowt4o7" data-path="src/pages/Dashboard.tsx">
                      {event.date} at {event.time}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-id="rh7ppxkfu" data-path="src/pages/Dashboard.tsx">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {user?.role === 'employee' &&
      <Card data-id="0oa99gnre" data-path="src/pages/Dashboard.tsx">
          <CardHeader data-id="p1p7bz25y" data-path="src/pages/Dashboard.tsx">
            <CardTitle data-id="179lzra58" data-path="src/pages/Dashboard.tsx">Quick Actions</CardTitle>
            <CardDescription data-id="j7nx9jdk0" data-path="src/pages/Dashboard.tsx">Frequently used features</CardDescription>
          </CardHeader>
          <CardContent data-id="g4utudig2" data-path="src/pages/Dashboard.tsx">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-id="0q86qit97" data-path="src/pages/Dashboard.tsx">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="4et77xwo2" data-path="src/pages/Dashboard.tsx">
                <MapPin className="h-6 w-6" data-id="rcq0rlrg1" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="aligl315d" data-path="src/pages/Dashboard.tsx">Check In</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="r8g3lqzg0" data-path="src/pages/Dashboard.tsx">
                <Calendar className="h-6 w-6" data-id="jopeqi5gc" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="nv1euyrkx" data-path="src/pages/Dashboard.tsx">Apply Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="80v8o19k7" data-path="src/pages/Dashboard.tsx">
                <FileText className="h-6 w-6" data-id="zgzravntl" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="rbmz7ucmq" data-path="src/pages/Dashboard.tsx">Submit Expense</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-id="whnrp1dvo" data-path="src/pages/Dashboard.tsx">
                <Clock className="h-6 w-6" data-id="cz8jva6n3" data-path="src/pages/Dashboard.tsx" />
                <span className="text-sm" data-id="fjjhv4s9f" data-path="src/pages/Dashboard.tsx">View Timesheet</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default Dashboard;