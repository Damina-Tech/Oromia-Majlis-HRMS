"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, UserPlus, ClipboardCheck, Eye, Calendar, Pencil, Trash2 } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function HalalInspectionAssignmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const preselectedAppId = (location.state as any)?.applicationId;
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState(preselectedAppId || "");
  const [inspectorIds, setInspectorIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInspectionId, setEditingInspectionId] = useState("");
  const [editingInspectorId, setEditingInspectorId] = useState("");
  const [editingScheduledAt, setEditingScheduledAt] = useState("");
  const [deleteInspectionId, setDeleteInspectionId] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedAppId) {
      setApplicationId(preselectedAppId);
      setAssignModalOpen(true);
    }
  }, [preselectedAppId]);

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ["halal-applications-assignable"],
    queryFn: () =>
      halalApi.applications.list({
        limit: 100,
        status: undefined,
      }),
    enabled: assignModalOpen,
  });
  const assignableApps =
    applications?.items?.filter((a) =>
      ["SUBMITTED", "REVIEW", "INSPECTION"].includes(a.status)
    ) ?? [];

  const { data: inspectors, isLoading: loadingInspectors } = useQuery({
    queryKey: ["halal-inspectors"],
    queryFn: () => halalApi.inspectors.list(),
    enabled: assignModalOpen || editModalOpen,
  });

  const { data: inspectionsData, isLoading: loadingInspections } = useQuery({
    queryKey: ["halal-inspections"],
    queryFn: () => halalApi.inspections.list({ limit: 100 }),
  });
  const inspections = inspectionsData?.items ?? [];

  const assignMutation = useMutation({
    mutationFn: (data: { applicationId: string; inspectorIds: string[]; scheduledAt?: string }) =>
      halalApi.inspections.assign(data),
    onSuccess: (response) => {
      toast.success(
        response.assignedCount > 1
          ? `${response.assignedCount} inspectors assigned successfully`
          : "Inspection assigned successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      setAssignModalOpen(false);
      setApplicationId("");
      setInspectorIds([]);
      setScheduledAt("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to assign inspection");
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; inspectorId?: string; scheduledAt?: string | null }) =>
      halalApi.inspections.update(data.id, {
        inspectorId: data.inspectorId,
        scheduledAt: data.scheduledAt,
      }),
    onSuccess: () => {
      toast.success("Inspection updated successfully");
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      setEditModalOpen(false);
      setEditingInspectionId("");
      setEditingInspectorId("");
      setEditingScheduledAt("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to update inspection");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => halalApi.inspections.delete(id),
    onSuccess: () => {
      toast.success("Inspection deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      setDeleteInspectionId(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to delete inspection");
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || inspectorIds.length === 0) {
      toast.error("Please select application and at least one inspector");
      return;
    }
    assignMutation.mutate({
      applicationId,
      inspectorIds,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  const openEditModal = (inspection: any) => {
    setEditingInspectionId(inspection.id);
    setEditingInspectorId(inspection.inspectorId ?? "");
    setEditingScheduledAt(
      inspection.scheduledAt
        ? new Date(inspection.scheduledAt).toISOString().slice(0, 16)
        : ""
    );
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInspectionId || !editingInspectorId) {
      toast.error("Please select inspector");
      return;
    }
    editMutation.mutate({
      id: editingInspectionId,
      inspectorId: editingInspectorId,
      scheduledAt: editingScheduledAt ? new Date(editingScheduledAt).toISOString() : null,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-600/20 dark:via-purple-600/10 border border-violet-200/50 dark:border-violet-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/halal/apply")}
              className="self-start text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-violet-900 dark:text-violet-100">
                Inspections
              </h1>
              <p className="text-violet-700/80 dark:text-violet-300/80 text-sm mt-1">
                Manage inspection assignments and track progress
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/halal/my-inspections")}
              className="border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950/40"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              My Inspections
            </Button>
            <Button
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Inspection
            </Button>
          </div>
        </div>
      </div>

      {/* Inspections list */}
      <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
            <ClipboardCheck className="h-5 w-5 text-violet-600" /> All inspections
          </CardTitle>
          <CardDescription>
            Inspections assigned to applications. Click Complete to submit a report.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingInspections ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">No inspections yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Assign an inspector to an application to get started.
              </p>
              <Button
                className="mt-4"
                onClick={() => setAssignModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Inspection
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business / Application</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((ins) => (
                      <TableRow key={ins.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {ins.application?.business?.name ?? ins.applicationId}
                        </TableCell>
                        <TableCell>
                          {ins.inspector
                            ? `${ins.inspector.firstName} ${ins.inspector.lastName}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ins.completedAt ? "default" : "secondary"}
                            className={
                              ins.completedAt
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                                : ""
                            }
                          >
                            {ins.completedAt ? "Completed" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {ins.scheduledAt
                            ? new Date(ins.scheduledAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {ins.completedAt ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/halal/applications/${ins.applicationId}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(ins)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                onClick={() => setDeleteInspectionId(ins.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                                onClick={() =>
                                  navigate(`/admin/halal/inspections/${ins.id}/complete`)
                                }
                              >
                                Complete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {inspections.map((ins) => (
                  <div
                    key={ins.id}
                    className="p-4 hover:bg-muted/30"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">
                          {ins.application?.business?.name ?? ins.applicationId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ins.inspector
                            ? `${ins.inspector.firstName} ${ins.inspector.lastName}`
                            : "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={ins.completedAt ? "default" : "secondary"}
                            className={
                              ins.completedAt
                                ? "bg-emerald-100 text-emerald-800"
                                : ""
                            }
                          >
                            {ins.completedAt ? "Completed" : "Pending"}
                          </Badge>
                          {ins.scheduledAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ins.scheduledAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {ins.completedAt ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/halal/applications/${ins.applicationId}`)
                          }
                        >
                          View
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(ins)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                            onClick={() => setDeleteInspectionId(ins.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                            onClick={() =>
                              navigate(`/admin/halal/inspections/${ins.id}/complete`)
                            }
                          >
                            Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign Inspection modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-600" /> Assign inspection
            </DialogTitle>
            <DialogDescription>
              Select an application and one or more eligible inspectors. Only users with halal.inspector permission can be assigned.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="application">Application</Label>
              <Select
                value={applicationId}
                onValueChange={setApplicationId}
                disabled={loadingApps}
              >
                <SelectTrigger id="application" className="w-full">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {assignableApps.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.business?.name ?? a.businessId} — {a.status}
                      {a.status === "SUBMITTED" &&
                        (a.feePaidAt ? " • Fee paid" : " • Fee pending")}
                    </SelectItem>
                  ))}
                  {assignableApps.length === 0 && !loadingApps && (
                    <SelectItem value="_none" disabled>
                      No assignable applications
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inspectors</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
                {loadingInspectors && (
                  <p className="text-sm text-muted-foreground">Loading inspectors...</p>
                )}
                {!loadingInspectors && inspectors?.map((inspector) => {
                  const checked = inspectorIds.includes(inspector.id);
                  return (
                    <label
                      key={inspector.id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          setInspectorIds((prev) =>
                            next
                              ? Array.from(new Set([...prev, inspector.id]))
                              : prev.filter((id) => id !== inspector.id)
                          );
                        }}
                      />
                      <span className="text-sm">
                        {inspector.firstName} {inspector.lastName} ({inspector.email})
                      </span>
                    </label>
                  );
                })}
                {(!inspectors || inspectors.length === 0) && !loadingInspectors && (
                  <p className="text-sm text-muted-foreground">No eligible inspectors available</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {inspectorIds.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled date (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignMutation.isPending || !applicationId || inspectorIds.length === 0}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign inspectors"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Inspection modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-violet-600" /> Edit inspection assignment
            </DialogTitle>
            <DialogDescription>
              Update inspector and/or scheduled date for this inspection.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-inspector">Inspector</Label>
              <Select
                value={editingInspectorId}
                onValueChange={setEditingInspectorId}
                disabled={loadingInspectors}
              >
                <SelectTrigger id="edit-inspector" className="w-full">
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {inspectors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.firstName} {i.lastName} ({i.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-scheduledAt">Scheduled date (optional)</Label>
              <Input
                id="edit-scheduledAt"
                type="datetime-local"
                value={editingScheduledAt}
                onChange={(e) => setEditingScheduledAt(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editMutation.isPending || !editingInspectorId}>
                {editMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteInspectionId} onOpenChange={(open) => !open && setDeleteInspectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inspection assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected inspection assignment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !deleteInspectionId}
              onClick={() => {
                if (deleteInspectionId) deleteMutation.mutate(deleteInspectionId);
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
