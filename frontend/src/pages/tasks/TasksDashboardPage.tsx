import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { getTaskStats, type TaskStats } from "@/services/tasks";

export default function TasksDashboardPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("tasks.view");

  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canView) {
      loadStats();
    }
  }, [canView]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getTaskStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load task stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view task statistics.</p>
        </div>
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

  if (!stats) {
    return null;
  }

  // Ensure stats have the required structure with defaults
  const safeStats = {
    totalTasks: stats.totalTasks || 0,
    completedTasks: stats.completedTasks || 0,
    overdueTasks: stats.overdueTasks || 0,
    tasksByStatus: stats.tasksByStatus || {},
    tasksByPriority: stats.tasksByPriority || {},
    totalTimeSpent: stats.totalTimeSpent || 0,
    tasksByUser: stats.tasksByUser || [],
  };

  const completionRate =
    safeStats.totalTasks > 0 ? ((safeStats.completedTasks / safeStats.totalTasks) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of task metrics and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{safeStats.totalTasks}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{safeStats.completedTasks}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{safeStats.overdueTasks}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across different statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(safeStats.tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${safeStats.totalTasks > 0 ? (count / safeStats.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(safeStats.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{priority}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${safeStats.totalTasks > 0 ? (count / safeStats.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Spent */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>Total time spent on tasks</CardDescription>
        </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Clock className="h-12 w-12 text-blue-500" />
              <div>
                <p className="text-3xl font-bold">{safeStats.totalTimeSpent.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Total Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by User */}
        {safeStats.tasksByUser && safeStats.tasksByUser.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks by User</CardTitle>
              <CardDescription>Number of tasks assigned per user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {safeStats.tasksByUser.slice(0, 10).map((item) => (
                <div
                  key={item.employeeId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </span>
                  </div>
                  <Badge variant="outline">{item.taskCount} tasks</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

