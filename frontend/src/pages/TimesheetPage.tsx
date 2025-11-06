import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listTimesheets,
  createTimesheet,
  submitTimesheet,
  addManualTimeEntry,
  formatDuration,
  getStatusColor,
  getStatusIcon,
  type Timesheet,
  type TimesheetSession,
  type CreateTimesheetSessionData,
  type ManualTimeEntryData,
} from "@/services/timesheet";
import {
  listTasks,
  getRemainingDays,
  isOverdue,
  type Task,
} from "@/services/tasks";

export default function TimesheetPage() {
  const { user } = useAuth();
  
  // State
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<{
    id: string;
    taskName: string;
    projectName: string;
    startTime: Date;
    description?: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Dialog states
  const [newTimerDialog, setNewTimerDialog] = useState(false);
  const [manualEntryDialog, setManualEntryDialog] = useState(false);
  
  // Form states
  const [timerForm, setTimerForm] = useState({
    taskName: "",
    projectName: "",
    description: "",
  });
  
  const [manualForm, setManualForm] = useState({
    taskName: "",
    projectName: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Check if user has employee record
  const employeeId = user?.employeeId;
  const canCreate = user?.permissions?.includes("timesheet.create");
  const canView = user?.permissions?.includes("timesheet.view");

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load timesheets and tasks
  useEffect(() => {
    if (employeeId && canView) {
      loadTimesheets();
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [employeeId, canView]);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await listTimesheets({
        pageSize: 100,
      });
      
      setTimesheets(response.items || []);
    } catch (err: any) {
      console.error("Failed to load timesheets:", err);
      setError(err.response?.data?.message || "Failed to load timesheets");
      toast.error("Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await listTasks({
        pageSize: 50,
        assigneeId: employeeId || undefined,
      });
      setTasks(response.items || []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    }
  };

  const getCurrentTimerDuration = () => {
    if (!activeTimer) return 0;
    return Math.floor(
      (currentTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60)
    );
  };

  const handleStartTimer = async () => {
    if (!timerForm.taskName || !timerForm.projectName) {
      toast.error("Please provide task and project names");
      return;
    }

    const timerData = {
      id: Date.now().toString(),
      taskName: timerForm.taskName,
      projectName: timerForm.projectName,
      startTime: new Date(),
      description: timerForm.description,
    };

    setActiveTimer(timerData);
    setNewTimerDialog(false);
    setTimerForm({ taskName: "", projectName: "", description: "" });
    
    toast.success(`Timer started for ${timerForm.taskName}`);
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;

    try {
      setSubmitting(true);
      
      // Create a timesheet session from the timer
      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60)
      );

      const sessionData: CreateTimesheetSessionData = {
        taskName: activeTimer.taskName,
        projectName: activeTimer.projectName,
        description: activeTimer.description,
        startTime: activeTimer.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      };

      // Create or update timesheet for today
      const today = format(new Date(), "yyyy-MM-dd");
      const existingTimesheet = timesheets.find(
        (t) => format(new Date(t.date), "yyyy-MM-dd") === today
      );

      if (existingTimesheet) {
        // Add session to existing timesheet
        const updatedSessions = [...existingTimesheet.sessions, sessionData as any];
        const updatedTimesheet = {
          ...existingTimesheet,
          sessions: updatedSessions,
          totalHours: Number(existingTimesheet.totalHours) + duration / 60,
        };
        
        await createTimesheet({
          date: today,
          sessions: updatedSessions.map(s => ({
            taskName: s.taskName,
            projectName: s.projectName,
            description: s.description,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration,
          })),
        });
      } else {
        // Create new timesheet
        await createTimesheet({
          date: today,
          sessions: [sessionData],
        });
      }

      setActiveTimer(null);
      await loadTimesheets();
      toast.success(`Timer stopped. Logged ${formatDuration(duration)} for ${activeTimer.taskName}`);
    } catch (err: any) {
      console.error("Failed to stop timer:", err);
      toast.error(err.response?.data?.message || "Failed to stop timer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualEntry = async () => {
    if (
      !manualForm.taskName ||
      !manualForm.projectName ||
      !manualForm.startTime ||
      !manualForm.endTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      const entryData: ManualTimeEntryData = {
        taskName: manualForm.taskName,
        projectName: manualForm.projectName,
        description: manualForm.description,
        date: manualForm.date,
        startTime: manualForm.startTime,
        endTime: manualForm.endTime,
        notes: manualForm.notes,
      };

      await addManualTimeEntry(entryData);
      
      setManualEntryDialog(false);
      setManualForm({
        taskName: "",
        projectName: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "",
        endTime: "",
        notes: "",
      });
      
      await loadTimesheets();
      toast.success("Manual time entry added successfully");
    } catch (err: any) {
      console.error("Failed to add manual entry:", err);
      toast.error(err.response?.data?.message || "Failed to add manual entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTimesheet = async (timesheetId: string) => {
    try {
      setSubmitting(true);
      
      await submitTimesheet(timesheetId);
      await loadTimesheets();
      toast.success("Timesheet submitted for approval");
    } catch (err: any) {
      console.error("Failed to submit timesheet:", err);
      toast.error(err.response?.data?.message || "Failed to submit timesheet");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading timesheets...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Timesheets</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadTimesheets}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show access denied state
  if (!employeeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Session Update Required</h3>
          <p className="text-gray-600 mb-4">
            Your session needs to be updated to access timesheet features. Please log out and log back in.
          </p>
          <Button onClick={() => window.location.href = "/login"}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view timesheets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
          <p className="text-muted-foreground">
            Track your time and manage timesheet entries
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Dialog open={manualEntryDialog} onOpenChange={setManualEntryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Manual Time Entry</DialogTitle>
                  <DialogDescription>
                    Add time entry for work done without using the timer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-name">Task Name</Label>
                    <Input
                      id="task-name"
                      value={manualForm.taskName}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          taskName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Bug Fix - Login Issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-name">Project</Label>
                    <Select
                      value={manualForm.projectName}
                      onValueChange={(value) =>
                        setManualForm((prev) => ({ ...prev, projectName: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR Management System">
                          HR Management System
                        </SelectItem>
                        <SelectItem value="E-commerce Platform">
                          E-commerce Platform
                        </SelectItem>
                        <SelectItem value="Mobile App">Mobile App</SelectItem>
                        <SelectItem value="Data Analytics">
                          Data Analytics
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={manualForm.date}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={manualForm.startTime}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={manualForm.endTime}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={manualForm.description}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Additional details about the work performed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={manualForm.notes}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setManualEntryDialog(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleManualEntry} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Entry"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Active Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTimer ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{activeTimer.taskName}</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTimer.projectName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Started at {format(activeTimer.startTime, "HH:mm")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-green-600">
                  {formatDuration(getCurrentTimerDuration())}
                </div>
                <Button
                  onClick={handleStopTimer}
                  variant="destructive"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Stop Timer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active timer</p>
              {canCreate && (
                <Dialog open={newTimerDialog} onOpenChange={setNewTimerDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Play className="mr-2 h-4 w-4" />
                      Start Timer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Timer</DialogTitle>
                      <DialogDescription>
                        Start tracking time for a new task
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="timer-task">Task Name</Label>
                        <Input
                          id="timer-task"
                          value={timerForm.taskName}
                          onChange={(e) =>
                            setTimerForm((prev) => ({
                              ...prev,
                              taskName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Bug Fix - Login Issue"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timer-project">Project</Label>
                        <Select
                          value={timerForm.projectName}
                          onValueChange={(value) =>
                            setTimerForm((prev) => ({
                              ...prev,
                              projectName: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HR Management System">
                              HR Management System
                            </SelectItem>
                            <SelectItem value="E-commerce Platform">
                              E-commerce Platform
                            </SelectItem>
                            <SelectItem value="Mobile App">Mobile App</SelectItem>
                            <SelectItem value="Data Analytics">
                              Data Analytics
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timer-description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="timer-description"
                          value={timerForm.description}
                          onChange={(e) =>
                            setTimerForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Brief description of the task"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setNewTimerDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleStartTimer}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Timer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Summary
          </CardTitle>
          <CardDescription>
            Total hours logged this week: {timesheets
              .filter((t) => {
                const timesheetDate = new Date(t.date);
                const now = new Date();
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return timesheetDate >= startOfWeek && timesheetDate <= endOfWeek;
              })
              .reduce((total: number, t) => total + Number(t.totalHours), 0)
              .toFixed(1)} hours
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tasks with Countdown */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Tasks
            </CardTitle>
            <CardDescription>
              Tasks assigned to you with remaining days to complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status !== "DONE" && t.status !== "CANCELLED")
                .slice(0, 10)
                .map((task) => {
                  const days = task.dueDate ? getRemainingDays(task.dueDate) : null;
                  const overdue = isOverdue(task);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                        overdue ? "border-l-4 border-l-red-500" : ""
                      } ${task.isUnread ? "bg-blue-50" : ""}`}
                      onClick={() => window.location.href = `/tasks/${task.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge variant="outline" className={overdue ? "bg-red-100 text-red-800" : ""}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                            {days !== null && (
                              <span className={`font-semibold ${overdue ? "text-red-600" : days <= 3 ? "text-orange-600" : "text-gray-600"}`}>
                                {overdue
                                  ? `${Math.abs(days)} days overdue`
                                  : days === 0
                                  ? "Due today"
                                  : `${days} days remaining`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {days !== null && (
                          <div className={`text-2xl font-bold ${overdue ? "text-red-600" : days <= 3 ? "text-orange-600" : "text-blue-600"}`}>
                            {overdue ? `-${Math.abs(days)}` : days}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.location.href = "/tasks"}
              >
                View All Tasks
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timesheet Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Entries</CardTitle>
          <CardDescription>
            Your recent timesheet entries and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Timesheets Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any timesheet entries yet.
              </p>
              {canCreate && (
                <Button onClick={() => setManualEntryDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Entry
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>{format(new Date(timesheet.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-mono">
                      {Number(timesheet.totalHours).toFixed(1)}h
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {timesheet.sessions.map((session, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{session.taskName}</div>
                            <div className="text-muted-foreground">
                              {session.projectName} •{" "}
                              {formatDuration(session.duration)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(timesheet.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(timesheet.status)}
                          {timesheet.status.charAt(0).toUpperCase() +
                            timesheet.status.slice(1).toLowerCase()}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {timesheet.status === "DRAFT" && canCreate && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitTimesheet(timesheet.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Submit"
                          )}
                        </Button>
                      )}
                      {timesheet.status === "REJECTED" && canCreate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitTimesheet(timesheet.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Resubmit"
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
