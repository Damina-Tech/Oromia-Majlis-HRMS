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
} from "lucide-react";
import { format } from "date-fns";

function useLocalTimesheet() {
  const [entries, setEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);

  const startTimer = (id, taskName, taskId, projectName, description) => {
    setActiveTimer({
      id,
      taskId,
      taskName,
      projectId: taskId,
      projectName,
      startTime: new Date(),
      description,
    });
  };

  const stopTimer = () => {
    if (!activeTimer) return null;
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - activeTimer.startTime.getTime()) / 60000
    );
    const session = { ...activeTimer, endTime, duration };
    const dateKey = format(activeTimer.startTime, "yyyy-MM-dd");

    const updated = [...entries];
    const entryIndex = updated.findIndex(
      (e) => format(e.date, "yyyy-MM-dd") === dateKey
    );

    if (entryIndex >= 0) {
      updated[entryIndex].sessions.push(session);
      updated[entryIndex].totalHours += duration / 60;
    } else {
      updated.push({
        id: Date.now().toString(),
        employeeId: "1",
        date: new Date(dateKey),
        sessions: [session],
        totalHours: duration / 60,
        status: "draft",
      });
    }

    setEntries(updated);
    setActiveTimer(null);
    return session;
  };

  const addEntry = (entry) => setEntries([...entries, entry]);

  const submitTimesheet = (id) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, status: "submitted" } : e))
    );
  };

  return {
    activeTimer,
    timesheetEntries: entries,
    startTimer,
    stopTimer,
    addTimesheetEntry: addEntry,
    submitTimesheet,
  };
}

function useLocalNotifications() {
  const addNotification = ({ title, message, type }) => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  };
  return { addNotification };
}

// The rest of your original TimesheetPage component remains the same
// Replace useTimesheet with useLocalTimesheet
// Replace useNotifications with useLocalNotifications

export default function TimesheetPage() {
  const {
    activeTimer,
    timesheetEntries,
    startTimer,
    stopTimer,
    addTimesheetEntry,
    submitTimesheet,
  } = useLocalTimesheet();
  const { addNotification } = useLocalNotifications();

  // Copy all other content of your TimesheetPage component here from your original file
  // All logic and handlers stay the same

  const [newTimerDialog, setNewTimerDialog] = useState(false);
  const [manualEntryDialog, setManualEntryDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
  });

  // Update current time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCurrentTimerDuration = () => {
    if (!activeTimer) return 0;
    return Math.floor(
      (currentTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60)
    );
  };

  const handleStartTimer = () => {
    if (!timerForm.taskName || !timerForm.projectName) {
      addNotification({
        title: "Missing Information",
        message: "Please provide task and project names",
        type: "error",
      });
      return;
    }

    startTimer(
      Date.now().toString(),
      timerForm.taskName,
      Date.now().toString(),
      timerForm.projectName,
      timerForm.description
    );

    addNotification({
      title: "Timer Started",
      message: `Started tracking time for ${timerForm.taskName}`,
      type: "success",
    });

    setNewTimerDialog(false);
    setTimerForm({ taskName: "", projectName: "", description: "" });
  };

  const handleStopTimer = () => {
    const session = stopTimer();
    if (session) {
      addNotification({
        title: "Timer Stopped",
        message: `Logged ${formatDuration(session.duration)} for ${
          session.taskName
        }`,
        type: "success",
      });
    }
  };

  const handleManualEntry = () => {
    if (
      !manualForm.taskName ||
      !manualForm.projectName ||
      !manualForm.startTime ||
      !manualForm.endTime
    ) {
      addNotification({
        title: "Missing Information",
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    const startDateTime = new Date(
      `${manualForm.date}T${manualForm.startTime}`
    );
    const endDateTime = new Date(`${manualForm.date}T${manualForm.endTime}`);
    const duration = Math.floor(
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
    );

    if (duration <= 0) {
      addNotification({
        title: "Invalid Time Range",
        message: "End time must be after start time",
        type: "error",
      });
      return;
    }

    const session = {
      id: Date.now().toString(),
      taskId: Date.now().toString(),
      taskName: manualForm.taskName,
      projectId: Date.now().toString(),
      projectName: manualForm.projectName,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      description: manualForm.description,
    };

    // Find or create timesheet entry for the date
    const entryDate = new Date(manualForm.date);
    const existingEntry = timesheetEntries.find(
      (entry) => format(entry.date, "yyyy-MM-dd") === manualForm.date
    );

    if (existingEntry) {
      // Add session to existing entry (this would need store method)
      addNotification({
        title: "Manual Entry Added",
        message: `Added ${formatDuration(duration)} to existing timesheet`,
        type: "success",
      });
    } else {
      // Create new entry
      addTimesheetEntry({
        employeeId: "1", // TODO: Use actual user ID
        date: entryDate,
        sessions: [session],
        totalHours: duration / 60,
        status: "draft",
      });

      addNotification({
        title: "Manual Entry Added",
        message: `Created new timesheet entry with ${formatDuration(duration)}`,
        type: "success",
      });
    }

    setManualEntryDialog(false);
    setManualForm({
      taskName: "",
      projectName: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
    });
  };

  const handleSubmitTimesheet = (entryId: string) => {
    submitTimesheet(entryId);
    addNotification({
      title: "Timesheet Submitted",
      message: "Your timesheet has been submitted for approval",
      type: "success",
    });
  };

  // const weekEntries = getCurrentWeekEntries();
  // const totalWeekHours = weekEntries.reduce(
  //   (total, entry) => total + entry.totalHours,
  //   0
  // );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "submitted":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // [Insert the entire JSX return block and functions like formatDuration, handleStartTimer, handleStopTimer, etc., from your original code here.]

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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setManualEntryDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleManualEntry}>Add Entry</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Timer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active timer</p>
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
            {/* Total hours logged this week: {totalWeekHours.toFixed(1)} hours */}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Timesheet Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Entries</CardTitle>
          <CardDescription>
            Your recent timesheet entries and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {timesheetEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(entry.date, "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-mono">
                    {entry.totalHours.toFixed(1)}h
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {entry.sessions.map((session, index) => (
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
                    <Badge className={getStatusColor(entry.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(entry.status)}
                        {entry.status.charAt(0).toUpperCase() +
                          entry.status.slice(1)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitTimesheet(entry.id)}
                      >
                        Submit
                      </Button>
                    )}
                    {entry.status === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmitTimesheet(entry.id)}
                      >
                        Resubmit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
