import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createTask,
  updateTask,
  type Task,
  type CreateTaskData,
  type UpdateTaskData,
} from "@/services/tasks";
import { listEmployees } from "@/services/employees";
import { listUsers } from "@/services/users";

interface TaskCreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess?: () => void;
}

export default function TaskCreateEditDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskCreateEditDialogProps) {
  const { hasPermission } = useAuth();
  const isEdit = !!task;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateTaskData>({
    title: "",
    description: "",
    project: "",
    priority: "MEDIUM",
    status: "TODO",
    startDate: "",
    dueDate: "",
    estimatedHours: undefined,
    recurrenceType: "NONE",
    tags: [],
    assigneeIds: [],
    watcherIds: [],
    dependencyTaskIds: [],
  });

  useEffect(() => {
    if (open) {
      loadEmployees();
      loadUsers();
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || "",
          project: task.project || "",
          priority: task.priority,
          status: task.status,
          startDate: task.startDate ? task.startDate.split("T")[0] : "",
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          estimatedHours: task.estimatedHours,
          recurrenceType: task.recurrenceType,
          tags: task.tags || [],
          assigneeIds: task.assignments?.map((a) => a.employeeId) || [],
          watcherIds: task.watchers?.map((w) => w.userId) || [],
          dependencyTaskIds: task.dependencies?.map((d) => d.dependsOnTaskId) || [],
        });
      } else {
        setFormData({
          title: "",
          description: "",
          project: "",
          priority: "MEDIUM",
          status: "TODO",
          startDate: "",
          dueDate: "",
          estimatedHours: undefined,
          recurrenceType: "NONE",
          tags: [],
          assigneeIds: [],
          watcherIds: [],
          dependencyTaskIds: [],
        });
      }
    }
  }, [open, task]);

  const loadEmployees = async () => {
    try {
      const response = await listEmployees({ pageSize: 1000 });
      setEmployees(response.items || []);
    } catch (err: any) {
      console.error("Failed to load employees:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await listUsers({ pageSize: 1000 });
      setUsers(response.items || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && task) {
        await updateTask(task.id, formData as UpdateTaskData);
        toast.success("Task updated successfully");
      } else {
        await createTask(formData);
        toast.success("Task created successfully");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(",").map((t) => t.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update task details" : "Create a new task and assign it to team members"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                placeholder="Project name"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              step="0.25"
              min="0"
              value={formData.estimatedHours || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
              placeholder="0.0"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(", ") || ""}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <Label htmlFor="assignees">Assignees</Label>
            <Select
              value={formData.assigneeIds?.[0] || ""}
              onValueChange={(value) => {
                const currentIds = formData.assigneeIds || [];
                if (currentIds.includes(value)) {
                  setFormData((prev) => ({
                    ...prev,
                    assigneeIds: currentIds.filter((id) => id !== value),
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    assigneeIds: [...currentIds, value],
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignees" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.assigneeIds && formData.assigneeIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assigneeIds.map((empId) => {
                  const emp = employees.find((e) => e.id === empId);
                  return (
                    <div
                      key={empId}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {emp ? `${emp.firstName} ${emp.lastName}` : empId}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            assigneeIds: prev.assigneeIds?.filter((id) => id !== empId) || [],
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEdit ? "Update Task" : "Create Task"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

