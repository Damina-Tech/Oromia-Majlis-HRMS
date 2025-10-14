import React, { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  FileText,
  Upload,
  Calendar,
  Users,
  Briefcase,
  GraduationCap,
  UserCheck,
  Settings,
} from "lucide-react";

export default function OnboardingPage() {
  const [newHires, setNewHires] = useState([]);
  const [onboardingTasks, setOnboardingTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("new-hires");
  const [addHireDialog, setAddHireDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [selectedNewHire, setSelectedNewHire] = useState(null);

  const [newHireForm, setNewHireForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    department: "",
    startDate: "",
    manager: "",
    buddy: "",
  });

  const showNotification = (title, message, type) => {
    setNotifications([...notifications, { title, message, type }]);
  };

  const addNewHire = () => {
    if (
      !newHireForm.firstName ||
      !newHireForm.lastName ||
      !newHireForm.email ||
      !newHireForm.position
    ) {
      showNotification(
        "Missing Information",
        "Please fill in all required fields",
        "error"
      );
      return;
    }
    const newHire = {
      ...newHireForm,
      employeeId: Date.now().toString(),
      startDate: new Date(newHireForm.startDate),
      status: "pending",
      documents: [],
      welcomeEmailSent: false,
      progress: 0,
    };
    setNewHires([...newHires, newHire]);
    showNotification(
      "New Hire Added",
      `${newHireForm.firstName} ${newHireForm.lastName} has been added`,
      "success"
    );
    setAddHireDialog(false);
    setNewHireForm({
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      department: "",
      startDate: "",
      manager: "",
      buddy: "",
    });
  };

  const updateTaskStatus = (newHireId, taskId, status) => {
    // Simulate task update logic here
    showNotification(
      "Task Updated",
      `Task status updated to ${status}`,
      "success"
    );
  };

  const sendWelcomeEmail = (newHireId) => {
    setNewHires((prev) =>
      prev.map((hire) =>
        hire.employeeId === newHireId
          ? { ...hire, welcomeEmailSent: true }
          : hire
      )
    );
    showNotification("Welcome Email Sent", "Email has been sent", "success");
  };

  const checkIn = (newHireId) => {
    setNewHires((prev) =>
      prev.map((hire) =>
        hire.employeeId === newHireId
          ? { ...hire, status: "in_progress" }
          : hire
      )
    );
    showNotification("Checked In", "Employee has been checked in", "success");
  };

  const getNewHiresByStatus = (status) =>
    newHires.filter((h) => h.status === status);

  const stats = {
    total: newHires.length,
    pending: getNewHiresByStatus("pending").length,
    inProgress: getNewHiresByStatus("in_progress").length,
    completed: getNewHiresByStatus("completed").length,
    avgProgress:
      newHires.reduce((sum, h) => sum + (h.progress || 0), 0) /
      (newHires.length || 1),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "documentation":
        return <FileText className="h-4 w-4" />;
      case "training":
        return <GraduationCap className="h-4 w-4" />;
      case "equipment":
        return <Briefcase className="h-4 w-4" />;
      case "access":
        return <Settings className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "not_started":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

    const handleTaskStatusUpdate = (newHireId: string, taskInstanceId: string, status: string) => {
    updateTaskStatus(newHireId, taskInstanceId, status as any);
    
    // addNotification({
    //   title: 'Task Updated',
    //   message: `Task status has been updated to ${status.replace('_', ' ')}`,
    //   type: 'success',
    // });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Onboarding
          </h1>
          <p className="text-muted-foreground">
            Manage new hire onboarding process and track progress
          </p>
        </div>
        <Dialog open={addHireDialog} onOpenChange={setAddHireDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Hire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hire</DialogTitle>
              <DialogDescription>
                Add a new employee to the onboarding process
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={newHireForm.firstName}
                    onChange={(e) =>
                      setNewHireForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={newHireForm.lastName}
                    onChange={(e) =>
                      setNewHireForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newHireForm.email}
                  onChange={(e) =>
                    setNewHireForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="john.doe@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={newHireForm.position}
                    onChange={(e) =>
                      setNewHireForm((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newHireForm.department}
                    onValueChange={(value) =>
                      setNewHireForm((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newHireForm.startDate}
                  onChange={(e) =>
                    setNewHireForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <Select
                    value={newHireForm.manager}
                    onValueChange={(value) =>
                      setNewHireForm((prev) => ({ ...prev, manager: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mgr-001">
                        Sarah Wilson - Engineering Manager
                      </SelectItem>
                      <SelectItem value="mgr-002">
                        Mike Johnson - Sales Manager
                      </SelectItem>
                      <SelectItem value="mgr-003">
                        Lisa Chen - HR Manager
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="buddy">Onboarding Buddy</Label>
                  <Select
                    value={newHireForm.buddy}
                    onValueChange={(value) =>
                      setNewHireForm((prev) => ({ ...prev, buddy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select buddy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emp-001">
                        John Doe - Senior Developer
                      </SelectItem>
                      <SelectItem value="emp-002">
                        Jane Smith - HR Specialist
                      </SelectItem>
                      <SelectItem value="emp-003">
                        Bob Wilson - Team Lead
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddHireDialog(false)}
                >
                  Cancel
                </Button>
                <Button>Add New Hire</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total New Hires
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.avgProgress)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new-hires">New Hires</TabsTrigger>
          <TabsTrigger value="tasks">Onboarding Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="new-hires" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Hire Progress</CardTitle>
              <CardDescription>
                Track onboarding progress for all new hires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newHires.map((hire) => (
                    <TableRow key={hire.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {hire.firstName} {hire.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {hire.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{hire.position}</div>
                          <div className="text-sm text-muted-foreground">
                            {hire.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(hire.startDate, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{hire.progress}%</span>
                          </div>
                          <Progress
                            value={hire.progress}
                            className="w-[60px]"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(hire.status)}>
                          {hire.status.charAt(0).toUpperCase() +
                            hire.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!hire.welcomeEmailSent && (
                            <Button
                              size="sm"
                              variant="outline"
                              // onClick={() => handleSendWelcomeEmail(hire.id)}
                            >
                              Send Welcome
                            </Button>
                          )}
                          {!hire.checkedInAt && hire.status === "pending" && (
                            <Button
                              size="sm"
                              // onClick={() => handleCheckIn(hire.id)}
                            >
                              Check In
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedNewHire(hire.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Selected New Hire Details */}
          {selectedNewHire && (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Tasks</CardTitle>
                <CardDescription>
                  Tasks for{" "}
                  {newHires.find((h) => h.id === selectedNewHire)?.firstName}{" "}
                  {newHires.find((h) => h.id === selectedNewHire)?.lastName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newHires
                    .find((h) => h.id === selectedNewHire)
                    ?.tasks.map((taskInstance) => {
                      const task = onboardingTasks.find(
                        (t) => t.id === taskInstance.taskId
                      );
                      if (!task) return null;

                      return (
                        <div
                          key={taskInstance.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(task.category)}
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge variant="outline">{task.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(taskInstance.status)}
                              <Badge
                                className={getStatusColor(taskInstance.status)}
                              >
                                {taskInstance.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                              Estimated: {task.estimatedDuration} min
                              {taskInstance.assignedTo && (
                                <span className="ml-2">
                                  • Assigned to: {taskInstance.assignedTo}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {taskInstance.status === "not_started" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleTaskStatusUpdate(
                                      selectedNewHire,
                                      taskInstance.id,
                                      "in_progress"
                                    )
                                  }
                                >
                                  Start Task
                                </Button>
                              )}
                              {taskInstance.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleTaskStatusUpdate(
                                      selectedNewHire,
                                      taskInstance.id,
                                      "completed"
                                    )
                                  }
                                >
                                  Mark Complete
                                </Button>
                              )}
                              {taskInstance.status === "completed" && (
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ Completed{" "}
                                  {taskInstance.completedAt &&
                                    format(taskInstance.completedAt, "MMM dd")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Task Templates</CardTitle>
              <CardDescription>
                Manage the standard onboarding tasks for all new hires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(task.category)}
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{task.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.estimatedDuration} min
                            </span>
                            {task.isRequired && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Order: {task.order}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>
                    {task.assignedRole && (
                      <div className="text-xs text-muted-foreground">
                        Assigned to: {task.assignedRole}
                      </div>
                    )}
                    {task.dependencies.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Dependencies:{" "}
                        {task.dependencies
                          .map(
                            (depId) =>
                              onboardingTasks.find((t) => t.id === depId)
                                ?.title || depId
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
