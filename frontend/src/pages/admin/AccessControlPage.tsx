import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus, RefreshCw, Shield, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  createDivisionAssignment,
  deleteDivisionAssignment,
  listDivisionAssignments,
  listOrgDivisions,
  updateOrgDivision,
  type DivisionAssignment,
  type OrgDivision,
} from "@/services/orgDivisions";
import { listUsers, getRoles, type User, type Role } from "@/services/users";

const DIVISION_ADMIN_ROLES = [
  "HR_DIVISION_ADMIN",
  "HALAL_DIVISION_ADMIN",
  "MEMBERSHIP_DIVISION_ADMIN",
  "INSTITUTION_DIVISION_ADMIN",
  "DIVISION_OFFICER",
];

const AccessControlPage: React.FC = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin() || hasPermission("divisions.manage");

  const [divisions, setDivisions] = useState<OrgDivision[]>([]);
  const [assignments, setAssignments] = useState<DivisionAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDivisionId, setFilterDivisionId] = useState<string>("all");

  const [editDivision, setEditDivision] = useState<OrgDivision | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    headUserId: "",
    active: true,
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: "",
    divisionId: "",
    roleId: "",
    isPrimary: false,
  });

  const divisionRoles = useMemo(
    () => roles.filter((r) => DIVISION_ADMIN_ROLES.includes(r.name)),
    [roles]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [divs, assigns, userRes, roleRes] = await Promise.all([
        listOrgDivisions(),
        listDivisionAssignments(),
        listUsers({ pageSize: 500 }),
        getRoles(),
      ]);
      setDivisions(divs);
      setAssignments(assigns);
      setUsers(userRes.items ?? []);
      setRoles(roleRes);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load access control data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssignments = useMemo(() => {
    if (filterDivisionId === "all") return assignments;
    return assignments.filter((a) => a.divisionId === filterDivisionId);
  }, [assignments, filterDivisionId]);

  const openEditDivision = (division: OrgDivision) => {
    setEditDivision(division);
    setEditForm({
      name: division.name,
      description: division.description ?? "",
      headUserId: division.headUserId ?? "",
      active: division.active,
    });
  };

  const saveDivision = async () => {
    if (!editDivision || !canManage) return;
    try {
      await updateOrgDivision(editDivision.id, {
        name: editForm.name,
        description: editForm.description || null,
        headUserId: editForm.headUserId || null,
        active: editForm.active,
      });
      toast.success("Division updated");
      setEditDivision(null);
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update division");
    }
  };

  const submitAssignment = async () => {
    if (!canManage) return;
    if (!assignForm.userId || !assignForm.divisionId || !assignForm.roleId) {
      toast.error("User, division, and role are required");
      return;
    }
    try {
      await createDivisionAssignment(assignForm);
      toast.success("Assignment created. User must re-login to refresh access.");
      setAssignOpen(false);
      setAssignForm({ userId: "", divisionId: "", roleId: "", isPrimary: false });
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create assignment");
    }
  };

  const removeAssignment = async (id: string) => {
    if (!canManage) return;
    if (!confirm("Remove this division assignment?")) return;
    try {
      await deleteDivisionAssignment(id);
      toast.success("Assignment removed");
      await loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to remove assignment");
    }
  };

  if (!isSuperAdmin() && !hasPermission("divisions.read") && !hasPermission("divisions.manage")) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Super admin or divisions.read permission required.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7" />
            Access Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure org divisions, department heads, and scoped admin assignments.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="divisions">
        <TabsList>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="assignments">User assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="divisions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Functional divisions
              </CardTitle>
              <CardDescription>
                Government org units (HR, Halal, Membership, etc.). Department heads receive division-scoped permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="outline">{d.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{d.name}</div>
                        {d.description && (
                          <div className="text-xs text-muted-foreground">{d.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.headUser
                          ? `${d.headUser.firstName} ${d.headUser.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell>{d._count?.assignments ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={d.active ? "default" : "secondary"}>
                          {d.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openEditDivision(d)}>
                            <UserCog className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={filterDivisionId} onValueChange={setFilterDivisionId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Button onClick={() => setAssignOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign user
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Primary</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">
                          {a.user ? `${a.user.firstName} ${a.user.lastName}` : a.userId}
                        </div>
                        <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                      </TableCell>
                      <TableCell>
                        {a.division ? `${a.division.code} — ${a.division.name}` : a.divisionId}
                      </TableCell>
                      <TableCell>{a.role?.name ?? a.roleId}</TableCell>
                      <TableCell>{a.isPrimary ? "Yes" : "No"}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => removeAssignment(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground py-8">
                        No assignments yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editDivision} onOpenChange={(open) => !open && setEditDivision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit division — {editDivision?.code}</DialogTitle>
            <DialogDescription>Update display name, head, and active status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="div-name">Name</Label>
              <Input
                id="div-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="div-desc">Description</Label>
              <Input
                id="div-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Department head</Label>
              <Select
                value={editForm.headUserId || "__none__"}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, headUserId: v === "__none__" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="div-active">Active</Label>
              <Switch
                id="div-active"
                checked={editForm.active}
                onCheckedChange={(checked) => setEditForm((f) => ({ ...f, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDivision(null)}>
              Cancel
            </Button>
            <Button onClick={saveDivision}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign user to division</DialogTitle>
            <DialogDescription>
              Users can hold multiple division roles. Mark one assignment as primary for default context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={assignForm.userId}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Division</Label>
              <Select
                value={assignForm.divisionId}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, divisionId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.filter((d) => d.active).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Division role</Label>
              <Select
                value={assignForm.roleId}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {divisionRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="assign-primary">Primary division</Label>
              <Switch
                id="assign-primary"
                checked={assignForm.isPrimary}
                onCheckedChange={(checked) => setAssignForm((f) => ({ ...f, isPrimary: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAssignment}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessControlPage;
