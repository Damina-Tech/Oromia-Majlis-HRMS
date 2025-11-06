import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Loader2,
  Eye,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  listDocumentRequests,
  createDocumentRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
  getRequestStatusLabel,
  getRequestStatusColor,
  getPriorityLabel,
  getPriorityColor,
  type DocumentRequest,
  type CreateDocumentRequestData,
  downloadDocument,
} from "@/services/documents";
import { listTemplates, type DocumentTemplate } from "@/services/documents";

export default function DocumentRequestsPage() {
  const { hasPermission, user } = useAuth();
  const canView = hasPermission("documents.view");
  const canManage = hasPermission("documents.manage");
  const isAdminOrHR = canManage; // Admin/HR can manage requests

  // State
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Create request form
  const [requestForm, setRequestForm] = useState<CreateDocumentRequestData>({
    templateId: "",
    purpose: "",
    priority: "NORMAL",
  });

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [canView, page, searchTerm, statusFilter, priorityFilter, templateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, templatesRes] = await Promise.all([
        listDocumentRequests({
          page,
          pageSize,
          status: statusFilter !== "all" ? statusFilter as any : undefined,
          priority: priorityFilter !== "all" ? priorityFilter as any : undefined,
          templateId: templateFilter !== "all" ? templateFilter : undefined,
          search: searchTerm || undefined,
        }),
        listTemplates({ active: true, status: "ACTIVE" }),
      ]);

      setRequests(requestsRes.items || []);
      setTotal(requestsRes.total || 0);
      setTemplates(templatesRes.items || []);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load document requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.templateId) {
      toast.error("Please select a template");
      return;
    }

    try {
      await createDocumentRequest(requestForm);
      toast.success("Document request submitted successfully");
      setCreateDialogOpen(false);
      setRequestForm({
        templateId: "",
        purpose: "",
        priority: "NORMAL",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create document request");
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await updateDocumentRequest(selectedRequest.id, { status: "APPROVED" });
      toast.success("Request approved successfully");
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await updateDocumentRequest(selectedRequest.id, {
        status: "REJECTED",
        rejectionReason,
      });
      toast.success("Request rejected");
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleGenerate = async (request: DocumentRequest) => {
    if (!request.generatedDocument) {
      try {
        await updateDocumentRequest(request.id, { status: "GENERATED" });
        toast.success("Document generated successfully");
        loadData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to generate document");
      }
    }
  };

  const handleCancel = async (request: DocumentRequest) => {
    if (request.status !== "PENDING") {
      toast.error("Only pending requests can be cancelled");
      return;
    }

    try {
      await deleteDocumentRequest(request.id);
      toast.success("Request cancelled successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view document requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Requests</h1>
          <p className="text-gray-600 mt-1">
            {isAdminOrHR ? "Manage document requests from employees" : "Request documents from HR"}
          </p>
        </div>
        {!isAdminOrHR && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
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
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="GENERATED">Generated</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || templateFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setTemplateFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            {total} request{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No document requests found</p>
              {!isAdminOrHR && (
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      {isAdminOrHR && <TableHead>Employee</TableHead>}
                      <TableHead>Purpose</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.template?.name || "Unknown"}
                        </TableCell>
                        {isAdminOrHR && (
                          <TableCell>
                            {request.employee
                              ? `${request.employee.firstName} ${request.employee.lastName}`
                              : "Unknown"}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="max-w-xs truncate" title={request.purpose}>
                            {request.purpose || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityLabel(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {getRequestStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {request.generatedDocument && (
                                <DropdownMenuItem
                                  onClick={() => downloadDocument(request.generatedDocument!.id)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {isAdminOrHR && request.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setApproveDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRejectDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isAdminOrHR && request.status === "APPROVED" && (
                                <DropdownMenuItem onClick={() => handleGenerate(request)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Document
                                </DropdownMenuItem>
                              )}
                              {!isAdminOrHR && request.status === "PENDING" && (
                                <DropdownMenuItem
                                  onClick={() => handleCancel(request)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
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

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} requests
                  </div>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Document</DialogTitle>
            <DialogDescription>Submit a request for a document from HR</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Template <span className="text-red-500">*</span>
              </Label>
              <Select
                value={requestForm.templateId}
                onValueChange={(value) => setRequestForm({ ...requestForm, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purpose / Reason</Label>
              <Textarea
                value={requestForm.purpose}
                onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                placeholder="Explain why you need this document..."
                rows={4}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={requestForm.priority}
                onValueChange={(value: any) => setRequestForm({ ...requestForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this document request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

