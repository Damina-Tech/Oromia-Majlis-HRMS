import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TaskCreateEditDialog from "@/components/TaskCreateEditDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getTask,
  updateTask,
  addComment,
  addTimeLog,
  uploadAttachment as uploadTaskAttachment,
  deleteAttachment as deleteTaskAttachment,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getRemainingDays,
  isOverdue,
  type Task,
  type TaskComment,
  type TaskAttachment,
  type TaskTimeLog,
  type TaskActivity,
} from "@/services/tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import api from "@/services/api";

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission("tasks.edit");
  const canDelete = hasPermission("tasks.delete");

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [timeLogHours, setTimeLogHours] = useState("");
  const [timeLogDate, setTimeLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeLogDescription, setTimeLogDescription] = useState("");
  const [submittingTimeLog, setSubmittingTimeLog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteAttachmentDialogOpen, setDeleteAttachmentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<TaskAttachment | null>(null);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getTask(id);
      setTask(data);
    } catch (err: any) {
      console.error("Failed to load task:", err);
      toast.error("Failed to load task");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await addComment(id, { content: commentText });
      toast.success("Comment added");
      setCommentText("");
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddTimeLog = async () => {
    if (!id || !timeLogHours || !timeLogDate) return;
    try {
      setSubmittingTimeLog(true);
      await addTimeLog(id, {
        date: timeLogDate,
        hours: parseFloat(timeLogHours),
        description: timeLogDescription || undefined,
      });
      toast.success("Time log added");
      setTimeLogHours("");
      setTimeLogDate(format(new Date(), "yyyy-MM-dd"));
      setTimeLogDescription("");
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to add time log");
    } finally {
      setSubmittingTimeLog(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      await uploadTaskAttachment(id, file);
      toast.success("File uploaded successfully");
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!id || !attachmentToDelete) return;
    try {
      await deleteTaskAttachment(id, attachmentToDelete.id);
      toast.success("Attachment deleted");
      setDeleteAttachmentDialogOpen(false);
      setAttachmentToDelete(null);
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to delete attachment");
    }
  };

  const handleStatusChange = async (status: Task["status"]) => {
    if (!id || !task) return;
    try {
      await updateTask(id, { status });
      toast.success("Status updated");
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handlePriorityChange = async (priority: Task["priority"]) => {
    if (!id || !task) return;
    try {
      await updateTask(id, { priority });
      toast.success("Priority updated");
      await loadTask();
    } catch (err: any) {
      toast.error("Failed to update priority");
    }
  };

  const downloadAttachment = (attachment: TaskAttachment) => {
    const baseURL = api.defaults.baseURL || "";
    window.open(`${baseURL}/tasks/${id}/attachments/${attachment.id}/download`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
          <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
        </div>
      </div>
    );
  }

  const days = task.dueDate ? getRemainingDays(task.dueDate) : null;
  const overdue = isOverdue(task);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
              {task.project && (
                <Badge variant="outline">{task.project}</Badge>
              )}
              {task.isUnread && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  New
                </Badge>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments ({task.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                <Paperclip className="h-4 w-4 mr-2" />
                Attachments ({task.attachments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="timelogs">
                <Clock className="h-4 w-4 mr-2" />
                Time Logs ({task.timeLogs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {canEdit && (
                      <div className="space-y-2">
                        <Label>Add Comment</Label>
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          rows={3}
                        />
                        <Button onClick={handleAddComment} disabled={submittingComment || !commentText.trim()}>
                          {submittingComment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    <div className="space-y-4">
                      {task.comments && task.comments.length > 0 ? (
                        task.comments.map((comment) => (
                          <div key={comment.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {comment.createdByUser?.firstName} {comment.createdByUser?.lastName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comment.createdAt), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No comments yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {canEdit && (
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-5 w-5" />
                            <span>Upload File</span>
                          </div>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="mt-2"
                        />
                        {uploadingFile && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {task.attachments && task.attachments.length > 0 ? (
                        task.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{attachment.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {(attachment.fileSize / 1024).toFixed(2)} KB •{" "}
                                  {format(new Date(attachment.uploadedAt), "MMM dd, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAttachment(attachment)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAttachmentToDelete(attachment);
                                    setDeleteAttachmentDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No attachments yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time Logs Tab */}
            <TabsContent value="timelogs" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {canEdit && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium">Add Time Log</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={timeLogDate}
                              onChange={(e) => setTimeLogDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Hours</Label>
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              value={timeLogHours}
                              onChange={(e) => setTimeLogHours(e.target.value)}
                              placeholder="0.0"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={timeLogDescription}
                            onChange={(e) => setTimeLogDescription(e.target.value)}
                            placeholder="What did you work on?"
                            rows={2}
                          />
                        </div>
                        <Button
                          onClick={handleAddTimeLog}
                          disabled={submittingTimeLog || !timeLogHours || !timeLogDate}
                        >
                          {submittingTimeLog ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Time Log
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {task.timeLogs && task.timeLogs.length > 0 ? (
                            task.timeLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.date), "MMM dd, yyyy")}</TableCell>
                                <TableCell>
                                  {log.employee.firstName} {log.employee.lastName}
                                </TableCell>
                                <TableCell className="font-mono">{log.hours}h</TableCell>
                                <TableCell>{log.description || "—"}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                No time logs yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {task.timeLogs && task.timeLogs.length > 0 && (
                        <div className="mt-4 text-right">
                          <p className="text-sm text-gray-600">
                            Total: <span className="font-bold">{task.actualHours || 0}h</span>
                            {task.estimatedHours && (
                              <span className="ml-2">
                                / Estimated: <span className="font-bold">{task.estimatedHours}h</span>
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {task.activities && task.activities.length > 0 ? (
                      task.activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-b-0">
                          <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {activity.actor.firstName} {activity.actor.lastName}
                              </span>
                              <span className="text-sm text-gray-600">
                                {activity.type.replace("_", " ").toLowerCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                            {activity.details && (
                              <pre className="text-xs text-gray-500 mt-1">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No activity yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subtasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/tasks/${subtask.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            subtask.status === "DONE" ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className={subtask.status === "DONE" ? "line-through text-gray-500" : ""}>
                          {subtask.title}
                        </span>
                      </div>
                      <Badge className={getStatusColor(subtask.status)}>
                        {getStatusLabel(subtask.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <>
                  <div>
                    <Label>Status</Label>
                    <Select value={task.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={task.priority} onValueChange={handlePriorityChange}>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Created By</Label>
                <p className="text-sm font-medium">
                  {task.createdByUser?.firstName} {task.createdByUser?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(task.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
              {task.dueDate && (
                <div>
                  <Label className="text-xs text-gray-500">Due Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">
                      {format(new Date(task.dueDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  {days !== null && (
                    <p
                      className={`text-xs font-semibold mt-1 ${
                        overdue
                          ? "text-red-600"
                          : days <= 3
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}
                    >
                      {overdue
                        ? `${Math.abs(days)} days overdue`
                        : days === 0
                        ? "Due today"
                        : `${days} days remaining`}
                    </p>
                  )}
                </div>
              )}
              {task.estimatedHours && (
                <div>
                  <Label className="text-xs text-gray-500">Estimated Hours</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">{task.estimatedHours}h</p>
                  </div>
                </div>
              )}
              {task.actualHours !== undefined && task.actualHours > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Actual Hours</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">{task.actualHours}h</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignees */}
          {task.assignments && task.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assignees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {assignment.employee.firstName} {assignment.employee.lastName}
                      </span>
                      {assignment.isUnread && (
                        <Badge variant="outline" className="text-xs bg-blue-100">
                          Unread
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/tasks/${dep.dependsOnTaskId}`)}
                    >
                      <p className="text-sm font-medium">{dep.dependsOnTask?.title}</p>
                      <Badge className={getStatusColor(dep.dependsOnTask?.status as any)}>
                        {getStatusLabel(dep.dependsOnTask?.status as any)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Attachment Dialog */}
      <AlertDialog open={deleteAttachmentDialogOpen} onOpenChange={setDeleteAttachmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{attachmentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttachment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      <TaskCreateEditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            // Reload task when dialog closes (in case it was updated)
            if (id) {
              loadTask();
            }
          }
        }}
        task={task}
        onSuccess={() => {
          setEditDialogOpen(false);
          if (id) {
            loadTask();
          }
        }}
      />
    </div>
  );
}

