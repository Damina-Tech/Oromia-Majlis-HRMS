import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TaskCreateEditDialog from "@/components/TaskCreateEditDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  listTasks,
  updateTask,
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

const STATUSES: Task["status"][] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function TasksKanbanPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasPermission("tasks.create");
  const canEdit = hasPermission("tasks.edit");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await listTasks({ pageSize: 1000 });
      setTasks(response.items || []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: Task["status"]) => {
    if (!draggedTask || !canEdit) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask.id, { status: newStatus });
      toast.success("Task status updated");
      await loadTasks();
    } catch (err: any) {
      toast.error("Failed to update task status");
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((t) => t.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600 mt-1">Drag and drop tasks to change status</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const statusTasks = getTasksByStatus(status);
          return (
            <div
              key={status}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">
                  {getStatusLabel(status)}
                </h3>
                <Badge className={getStatusColor(status)}>
                  {statusTasks.length}
                </Badge>
              </div>
              <div className="flex-1 space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable={canEdit}
                    onDragStart={() => handleDragStart(task)}
                    className={`cursor-move hover:shadow-md transition-shadow ${
                      isOverdue(task) ? "border-l-4 border-l-red-500" : ""
                    } ${task.isUnread ? "border-l-4 border-l-blue-500" : ""}`}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => navigate(`/tasks/edit/${task.id}`)}>
                                Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.project && (
                          <Badge variant="outline" className="text-xs">
                            {task.project}
                          </Badge>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.dueDate), "MMM dd")}</span>
                          {(() => {
                            const days = getRemainingDays(task.dueDate);
                            if (days !== null) {
                              if (days < 0) {
                                return <span className="text-red-600 ml-1">({Math.abs(days)} days overdue)</span>;
                              } else if (days === 0) {
                                return <span className="text-orange-600 ml-1">(Due today)</span>;
                              } else if (days <= 3) {
                                return <span className="text-orange-600 ml-1">({days} days left)</span>;
                              }
                            }
                            return null;
                          })()}
                        </div>
                      )}
                      {task.assignments && task.assignments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{task.assignments.length} assignee{task.assignments.length > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      {task.estimatedHours && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>Est: {task.estimatedHours}h</span>
                          {task.actualHours && (
                            <span className="ml-1">/ Act: {task.actualHours}h</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Dialog */}
      <TaskCreateEditDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTasks}
      />
    </div>
  );
}

