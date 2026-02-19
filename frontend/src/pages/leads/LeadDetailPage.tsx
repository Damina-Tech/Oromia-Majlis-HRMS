import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LeadDetail,
  LeadStage,
  LeadPriority,
  LeadDispositionReason,
  getLead,
  changeLeadStage,
  assignLead,
  addLeadNote,
  dispositionLead,
} from "@/services/leads";
import { listUsers, User } from "@/services/users";
import { listDepartments, Department } from "@/services/departments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, Mail, Phone, Building2, MapPin, Tag, CalendarClock, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "ENGAGED", label: "Engaged" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "READY_TO_CONVERT", label: "Ready to Convert" },
  { value: "CONVERTED", label: "Converted" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRIORITY_OPTIONS: LeadPriority[] = ["HIGH", "MEDIUM", "LOW"];

const DISPOSITION_REASONS: LeadDispositionReason[] = [
  "PRICE",
  "NOT_INTERESTED",
  "WRONG_CONTACT",
  "COMPETITOR",
  "POSTPONED",
  "OTHER",
];

const NONE_VALUE = "__NONE__";

const stageLabel = (stage: LeadStage) =>
  STAGE_OPTIONS.find((opt) => opt.value === stage)?.label ?? stage.replace("_", " ");

const LeadDetailPage: React.FC = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<{ userId: string; departmentId: string; priority: LeadPriority }>({
    userId: "",
    departmentId: "",
    priority: "MEDIUM",
  });
  const [assigning, setAssigning] = useState(false);
  const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
  const [dispositionForm, setDispositionForm] = useState<{ reason: LeadDispositionReason; note: string }>({
    reason: "NOT_INTERESTED",
    note: "",
  });
  const [dispositionSaving, setDispositionSaving] = useState(false);

  const loadLead = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const data = await getLead(leadId);
      setLead(data);
      setAssignForm({
        userId: data.assignedToUser?.id ?? "",
        departmentId: data.assignedDepartment?.id ?? "",
        priority: data.priority,
      });
    } catch (error: any) {
      toast.error("Unable to fetch lead", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [userResp, deptResp] = await Promise.all([
          listUsers({ page: 1, pageSize: 100 }),
          listDepartments(),
        ]);
        setUsers(userResp.items);
        setDepartments(deptResp);
      } catch (error) {
        console.warn("Failed to load helpers", error);
      }
    };
    bootstrap();
  }, []);

  const handleStageChange = async (stage: LeadStage) => {
    if (!leadId) return;
    try {
      await changeLeadStage(leadId, { stage });
      toast.success("Stage updated", {
        description: `Lead is now ${stageLabel(stage)}.`,
      });
      loadLead();
    } catch (error: any) {
      toast.error("Stage update failed", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    }
  };

  const handleAssign = async () => {
    if (!leadId || !assignForm.userId) {
      toast.error("Select an owner first");
      return;
    }
    setAssigning(true);
    try {
      await assignLead(leadId, {
        assignedToUserId: assignForm.userId,
        assignedDepartmentId: assignForm.departmentId || undefined,
        priority: assignForm.priority,
      });
      toast.success("Assignment updated", {
        description: "The new owner has been notified.",
      });
      setAssignDialogOpen(false);
      loadLead();
    } catch (error: any) {
      toast.error("Assignment failed", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleAddNote = async () => {
    if (!leadId || !note.trim()) return;
    setSavingNote(true);
    try {
      await addLeadNote(leadId, { content: note });
      toast.success("Note added");
      setNote("");
      loadLead();
    } catch (error: any) {
      toast.error("Failed to add note", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDisposition = async () => {
    if (!leadId) return;
    setDispositionSaving(true);
    try {
      await dispositionLead(leadId, dispositionForm);
      toast.success("Lead archived", {
        description: dispositionForm.note || "This opportunity has been archived.",
      });
      setDispositionDialogOpen(false);
      loadLead();
    } catch (error: any) {
      toast.error("Failed to disposition lead", {
        description: error?.response?.data?.message ?? "Unexpected error",
      });
    } finally {
      setDispositionSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading lead...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/leads")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Lead not found or inaccessible.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/leads")} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Button>

      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-500 p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Opportunity overview
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold">{lead.fullName}</h1>
              <Badge className="border border-white/40 bg-white/10 text-white">
                {lead.priority}
              </Badge>
              <Badge className="border border-white/40 bg-white/10 text-white">
                {stageLabel(lead.stage)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {lead.companyName && (
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {lead.companyName}
                </span>
              )}
              {(lead.address || lead.location) && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {lead.address || lead.location}
                </span>
              )}
              {lead.gender && (
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {lead.gender}
                </span>
              )}
              {lead.education && (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {lead.education}
                </span>
              )}
              {lead.tags?.length ? (
                <span className="inline-flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {lead.tags.join(", ")}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={lead.stage} onValueChange={(value) => handleStageChange(value as LeadStage)}>
              <SelectTrigger className="w-60 border-white/40 bg-white/10 text-white focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-white/80">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setAssignDialogOpen(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Assign
            </Button>
            <Button variant="secondary" className="border border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => setDispositionDialogOpen(true)}>
              Archive
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Core communication channels.</CardDescription>
            </div>
            <Badge variant="secondary">Primary</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {lead.email ?? "No email"}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 p-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {lead.phone ?? "No phone"}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 p-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Last contact: {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Owner</CardTitle>
            <CardDescription>Assignment & follow-up plan.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <p className="text-base font-semibold">
                {lead.assignedToUser
                  ? `${lead.assignedToUser.firstName} ${lead.assignedToUser.lastName}`
                  : "Unassigned"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Department</p>
              <p>{lead.assignedDepartment?.name ?? "—"}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Next follow-up</p>
              <p>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : "Not scheduled"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Source and attributes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
              <span className="text-muted-foreground">Source</span>
              <Badge variant="secondary">{lead.source ?? "Unknown"}</Badge>
            </div>
            {lead.gender && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
                <span className="text-muted-foreground">Gender</span>
                <span>{lead.gender}</span>
              </div>
            )}
            {lead.education && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
                <span className="text-muted-foreground">Education</span>
                <span>{lead.education}</span>
              </div>
            )}
            {(lead.address || lead.location) && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
                <span className="text-muted-foreground">Address</span>
                <span>{lead.address || lead.location}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{lead.status}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 p-3">
              <span className="text-muted-foreground">Potential value</span>
              <span>{lead.potentialValue ? `ETB ${Number(lead.potentialValue).toLocaleString()}` : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Auto-captured timeline of interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-6">
                {lead.histories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                )}
                {lead.histories.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 -translate-x-1 rounded-full bg-primary shadow" />
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold capitalize">
                      {entry.action.replace("_", " ").toLowerCase()}
                    </div>
                    {entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}
                    {entry.actor && (
                      <p className="text-xs text-muted-foreground">
                        By {entry.actor.firstName} {entry.actor.lastName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Share context and progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                id="note"
                placeholder="Log touchpoints, commitments..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[90px]"
              />
              <Button size="sm" className="w-full" onClick={handleAddNote} disabled={savingNote}>
                {savingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save note
              </Button>
            </div>
            <div className="space-y-3">
              {lead.notes.map((noteItem) => (
                <div key={noteItem.id} className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3">
                  <p className="text-sm">{noteItem.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {noteItem.author.firstName} {noteItem.author.lastName} ·{" "}
                    {new Date(noteItem.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Linked tasks</CardTitle>
          <CardDescription>Follow-up and workflow execution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.taskLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks linked to this lead yet.</p>
          )}
          {lead.taskLinks.map((link) => (
            <div
              key={link.task.id}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-3"
            >
              <div>
                <p className="text-sm font-semibold">{link.task.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due {link.task.dueDate ? new Date(link.task.dueDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <Badge variant="outline">{link.task.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign lead</DialogTitle>
            <DialogDescription>Choose an owner and department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={assignForm.userId}
                onValueChange={(value) => setAssignForm((prev) => ({ ...prev, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={assignForm.departmentId || NONE_VALUE}
                onValueChange={(value) =>
                  setAssignForm((prev) => ({ ...prev, departmentId: value === NONE_VALUE ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={assignForm.priority}
                onValueChange={(value) => setAssignForm((prev) => ({ ...prev, priority: value as LeadPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dispositionDialogOpen} onOpenChange={setDispositionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive lead</DialogTitle>
            <DialogDescription>Capture a disposition reason before archiving.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select
              value={dispositionForm.reason}
              onValueChange={(value) =>
                setDispositionForm((prev) => ({ ...prev, reason: value as LeadDispositionReason }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPOSITION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={dispositionForm.note}
                onChange={(e) => setDispositionForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispositionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisposition} disabled={dispositionSaving}>
              {dispositionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadDetailPage;

