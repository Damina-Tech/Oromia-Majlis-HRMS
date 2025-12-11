import api from "./api";

// Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  project?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurrenceRule?: any;
  parentTaskId?: string;
  tags: string[];
  createdBy: string;
  updatedBy?: string;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  completedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignments?: TaskAssignment[];
  watchers?: TaskWatcher[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  activities?: TaskActivity[];
  subtasks?: Task[];
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  timeLogs?: TaskTimeLog[];
  parentTask?: {
    id: string;
    title: string;
    status: string;
  };
  _count?: {
    comments: number;
    attachments: number;
    subtasks: number;
    timeLogs: number;
  };
  isUnread?: boolean;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email?: string;
  };
  assignedBy: string;
  assignedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedAt: string;
  lastReadAt?: string;
  isUnread: boolean;
}

export interface TaskWatcher {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  addedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  mentions: string[];
  createdBy: string;
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  uploadedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  type: string;
  actorId: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  details?: any;
  createdAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTask?: {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
  };
  createdAt: string;
}

export interface TaskTimeLog {
  id: string;
  taskId: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  date: string;
  hours: number;
  description?: string;
  loggedBy: string;
  loggedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  loggedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  project?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurrenceRule?: any;
  parentTaskId?: string;
  tags?: string[];
  assigneeIds?: string[];
  watcherIds?: string[];
  dependencyTaskIds?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
}

export interface ListTasksQuery {
  page?: number;
  pageSize?: number;
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  project?: string;
  assigneeId?: string;
  createdBy?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  tag?: string;
  overdueOnly?: boolean;
  unreadOnly?: boolean;
}

export interface AddCommentData {
  content: string;
  mentions?: string[];
}

export interface AddTimeLogData {
  date: string;
  hours: number;
  description?: string;
}

export interface BulkUpdateTasksData {
  taskIds: string[];
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeIds?: string[];
  dueDate?: string | null;
}

export interface TaskStats {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  overdueTasks: number;
  completedTasks: number;
  totalTimeSpent: number;
  tasksByUser: Array<{
    employeeId: string;
    employee?: {
      id: string;
      firstName: string;
      lastName: string;
      employeeCode: string;
    };
    taskCount: number;
  }>;
}

// API functions
export const listTasks = async (query?: ListTasksQuery): Promise<{
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const response = await api.get("/tasks", { params: query });
  return response.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const response = await api.post("/tasks", data);
  return response.data;
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const addComment = async (id: string, data: AddCommentData): Promise<TaskComment> => {
  const response = await api.post(`/tasks/${id}/comments`, data);
  return response.data;
};

export const addTimeLog = async (id: string, data: AddTimeLogData): Promise<TaskTimeLog> => {
  const response = await api.post(`/tasks/${id}/time-logs`, data);
  return response.data;
};

export const bulkUpdateTasks = async (data: BulkUpdateTasksData): Promise<void> => {
  await api.post("/tasks/bulk-update", data);
};

export const getTaskStats = async (): Promise<TaskStats> => {
  const response = await api.get("/tasks/stats");
  return response.data;
};

export const uploadAttachment = async (taskId: string, file: File): Promise<TaskAttachment> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
};

// Helper functions
export const getPriorityLabel = (priority: Task["priority"]): string => {
  const labels: Record<Task["priority"], string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
  };
  return labels[priority] || priority;
};

export const getPriorityColor = (priority: Task["priority"]): string => {
  const colors: Record<Task["priority"], string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
};

export const getStatusLabel = (status: Task["status"]): string => {
  const labels: Record<Task["status"], string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    DONE: "Done",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

export const getStatusColor = (status: Task["status"]): string => {
  const colors: Record<Task["status"], string> = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW: "bg-yellow-100 text-yellow-800",
    DONE: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// Calculate remaining days until due date
export const getRemainingDays = (dueDate?: string): number | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
};

// Check if task is overdue
export const isOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === "DONE" || task.status === "CANCELLED") {
    return false;
  }
  const due = new Date(task.dueDate);
  const now = new Date();
  return due < now;
};

