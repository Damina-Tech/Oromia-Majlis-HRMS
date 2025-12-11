import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TaskCreateEditDialog from "@/components/TaskCreateEditDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  listTasks,
  deleteTask,
  bulkUpdateTasks,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getRemainingDays,
  isOverdue,
  type Task,
} from "@/services/tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TasksListPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission("tasks.create");
  const canEdit = hasPermission("tasks.edit");
  const canDelete = hasPermission("tasks.delete");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, [page, searchTerm, statusFilter, priorityFilter, projectFilter, overdueOnly, unreadOnly]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await listTasks({
        page,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as any) : undefined,
        project: projectFilter !== "all" ? projectFilter : undefined,
        ...(overdueOnly && { overdueOnly: true }),
        ...(unreadOnly && { unreadOnly: true }),
      });
      
      console.log("Tasks response:", response);
      console.log("Response items:", response.items);
      console.log("Response total:", response.total);
      
      // Handle both possible response structures
      const items = response.items || response.data?.items || [];
      const total = response.total || response.data?.total || 0;
      
      console.log("Setting tasks:", items.length, "items");
      console.log("Setting total:", total);
      
      setTasks(items);
      setTotal(total);
      setSelectedTasks([]);
      
      if (items.length === 0) {
        console.log("No tasks found - this might be expected if no tasks exist in the database");
      }
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      console.error("Error details:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to load tasks");
      setTasks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      toast.success("Task deleted successfully");
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      loadTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleBulkStatusUpdate = async (status: Task["status"]) => {
    if (selectedTasks.length === 0) return;
    try {
      await bulkUpdateTasks({ taskIds: selectedTasks, status });
      toast.success(`Updated ${selectedTasks.length} task(s)`);
      loadTasks();
    } catch (err: any) {
      toast.error("Failed to update tasks");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    try {
      await Promise.all(selectedTasks.map((id) => deleteTask(id)));
      toast.success(`Deleted ${selectedTasks.length} task(s)`);
      loadTasks();
    } catch (err: any) {
      toast.error("Failed to delete tasks");
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  // Get unique projects for filter
  const projects = Array.from(
    new Set(tasks.map((t) => t.project).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track your tasks</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {projects.length > 0 && (
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="overdueOnly"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="overdueOnly" className="text-sm text-gray-600 cursor-pointer">
                Overdue Only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="unreadOnly"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="unreadOnly" className="text-sm text-gray-600 cursor-pointer">
                Unread Only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedTasks.length} task(s) selected
              </span>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("TODO")}>
                      To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("IN_PROGRESS")}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("REVIEW")}>
                      Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("DONE")}>
                      Done
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete && (
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading tasks...</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No tasks found</p>
              {canCreate && (
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === tasks.length && tasks.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        isOverdue(task) ? "bg-red-50" : ""
                      } ${task.isUnread ? "bg-blue-50" : ""}`}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {task.isUnread && (
                            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                          )}
                          {task.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.project || "—"}</TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex flex-col">
                            <span>{format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                            {(() => {
                              const days = getRemainingDays(task.dueDate);
                              if (days !== null) {
                                if (days < 0) {
                                  return (
                                    <span className="text-xs text-red-600">
                                      {Math.abs(days)} days overdue
                                    </span>
                                  );
                                } else if (days === 0) {
                                  return <span className="text-xs text-orange-600">Due today</span>;
                                } else if (days <= 3) {
                                  return (
                                    <span className="text-xs text-orange-600">{days} days left</span>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assignments && task.assignments.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {task.assignments.length} assignee{task.assignments.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {task.estimatedHours || task.actualHours ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>
                              {task.estimatedHours ? `Est: ${task.estimatedHours}h` : ""}
                              {task.estimatedHours && task.actualHours ? " / " : ""}
                              {task.actualHours ? `Act: ${task.actualHours}h` : ""}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setTaskToDelete(task);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Task Dialog */}
      <TaskCreateEditDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTasks}
      />
      <TaskCreateEditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        task={taskToEdit}
        onSuccess={loadTasks}
      />
    </div>
  );
}

