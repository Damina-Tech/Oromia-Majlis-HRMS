import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  listAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance,
  assignEmployeeAllowance,
  listEmployeeAllowances,
  removeEmployeeAllowance,
  type Allowance,
  type AllowanceType,
  type EmployeeAllowance,
} from "@/services/allowances";
import { listEmployees } from "@/services/employees";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";

const AllowancesPage: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [employeeAllowances, setEmployeeAllowances] = useState<EmployeeAllowance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteAllowanceDialog, setShowDeleteAllowanceDialog] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null);

  const [allowanceForm, setAllowanceForm] = useState({
    name: "",
    type: "TRANSPORT" as AllowanceType,
    description: "",
    amount: "",
    isPercentage: false,
    percentage: "",
    isActive: true,
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    allowanceId: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    amount: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await listEmployees({ page: 1, pageSize: 1000 });
      setEmployees(data.items || []);
    } catch (error: any) {
      console.error("Failed to load employees:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [allowancesData, assignmentsData] = await Promise.all([
        listAllowances(),
        listEmployeeAllowances(),
      ]);
      setAllowances(allowancesData.items || []);
      setEmployeeAllowances(assignmentsData || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load allowances");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllowance = async () => {
    if (!allowanceForm.name || !allowanceForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedAllowance) {
        await updateAllowance(selectedAllowance.id, {
          name: allowanceForm.name,
          type: allowanceForm.type,
          description: allowanceForm.description,
          amount: Number(allowanceForm.amount),
          isPercentage: allowanceForm.isPercentage,
          percentage: allowanceForm.isPercentage && allowanceForm.percentage ? (Number(allowanceForm.percentage) / 100) : undefined,
          isActive: allowanceForm.isActive,
        });
        toast.success("Allowance updated successfully");
      } else {
        await createAllowance({
          name: allowanceForm.name,
          type: allowanceForm.type,
          description: allowanceForm.description,
          amount: Number(allowanceForm.amount),
          isPercentage: allowanceForm.isPercentage,
          percentage: allowanceForm.isPercentage && allowanceForm.percentage ? (Number(allowanceForm.percentage) / 100) : undefined,
          isActive: allowanceForm.isActive,
        });
        toast.success("Allowance created successfully");
      }
      setShowAllowanceDialog(false);
      resetAllowanceForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save allowance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAllowance = async () => {
    if (!assignForm.employeeId || !assignForm.allowanceId || !assignForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await assignEmployeeAllowance({
        employeeId: assignForm.employeeId,
        allowanceId: assignForm.allowanceId,
        month: assignForm.month,
        amount: Number(assignForm.amount),
        notes: assignForm.notes,
      });
      toast.success("Allowance assigned successfully");
      setShowAssignDialog(false);
      resetAssignForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign allowance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAllowance = async () => {
    if (!selectedAllowance) return;
    try {
      await deleteAllowance(selectedAllowance.id);
      toast.success("Allowance deleted successfully");
      setShowDeleteAllowanceDialog(false);
      setSelectedAllowance(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete allowance");
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await removeEmployeeAllowance(id);
      toast.success("Allowance assignment removed");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove assignment");
    }
  };

  const resetAllowanceForm = () => {
    setAllowanceForm({
      name: "",
      type: "TRANSPORT",
      description: "",
      amount: "",
      isPercentage: false,
      percentage: "",
      isActive: true,
    });
    setSelectedAllowance(null);
  };

  const resetAssignForm = () => {
    setAssignForm({
      employeeId: "",
      allowanceId: "",
      month: new Date().toISOString().slice(0, 7),
      amount: "",
      notes: "",
    });
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">You don't have permission to view allowances.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Allowances</h1>
          <p className="text-gray-600 mt-1">Manage allowance configurations and assignments</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetAssignForm();
                setShowAssignDialog(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Allowance
            </Button>
            <Button
              onClick={() => {
                resetAllowanceForm();
                setShowAllowanceDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Allowance
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Allowance Configurations</TabsTrigger>
          <TabsTrigger value="assignments">Employee Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations">
          <Card>
            <CardHeader>
              <CardTitle>Allowance Configurations</CardTitle>
              <CardDescription>Manage allowance types and amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : allowances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8 text-gray-500">
                        No allowances found
                      </TableCell>
                    </TableRow>
                  ) : (
                    allowances.map((allowance) => (
                      <TableRow key={allowance.id}>
                        <TableCell className="font-medium">{allowance.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{allowance.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            {allowance.isPercentage ? (
                              <span>{allowance.percentage}%</span>
                            ) : (
                              <span>ETB {allowance.amount.toLocaleString()}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {allowance.isPercentage ? "Percentage" : "Fixed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={allowance.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {allowance.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAllowance(allowance);
                                  setAllowanceForm({
                                    name: allowance.name,
                                    type: allowance.type,
                                    description: allowance.description || "",
                                    amount: allowance.amount.toString(),
                                    isPercentage: allowance.isPercentage,
                                    percentage: allowance.percentage ? (allowance.percentage * 100).toString() : "",
                                    isActive: allowance.isActive,
                                  });
                                  setShowAllowanceDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAllowance(allowance);
                                  setShowDeleteAllowanceDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Employee Allowance Assignments</CardTitle>
              <CardDescription>Allowances assigned to employees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Allowance</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : employeeAllowances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8 text-gray-500">
                        No assignments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeAllowances.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {assignment.employee.firstName} {assignment.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{assignment.employee.employeeCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{assignment.allowance.name}</TableCell>
                        <TableCell>{assignment.month}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            ETB {assignment.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Allowance Dialog */}
      <Dialog open={showAllowanceDialog} onOpenChange={(open) => {
        setShowAllowanceDialog(open);
        if (!open) resetAllowanceForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAllowance ? "Edit" : "Create"} Allowance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowanceName">Name *</Label>
                <Input
                  id="allowanceName"
                  value={allowanceForm.name}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, name: e.target.value })}
                  placeholder="e.g., Transport Allowance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowanceType">Type *</Label>
                <Select
                  value={allowanceForm.type}
                  onValueChange={(v) => setAllowanceForm({ ...allowanceForm, type: v as AllowanceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="HOUSING">Housing</SelectItem>
                    <SelectItem value="MEAL">Meal</SelectItem>
                    <SelectItem value="COMMUNICATION">Communication</SelectItem>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowanceDescription">Description</Label>
              <Textarea
                id="allowanceDescription"
                value={allowanceForm.description}
                onChange={(e) => setAllowanceForm({ ...allowanceForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPercentage"
                checked={allowanceForm.isPercentage}
                onCheckedChange={(checked) => setAllowanceForm({ ...allowanceForm, isPercentage: checked })}
              />
              <Label htmlFor="isPercentage">Percentage-based calculation</Label>
            </div>

            {allowanceForm.isPercentage ? (
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage *</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  value={allowanceForm.percentage}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, percentage: e.target.value })}
                  placeholder="e.g., 10 for 10%"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="allowanceAmount">Amount (ETB) *</Label>
                <Input
                  id="allowanceAmount"
                  type="number"
                  step="0.01"
                  value={allowanceForm.amount}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, amount: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={allowanceForm.isActive}
                onCheckedChange={(checked) => setAllowanceForm({ ...allowanceForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllowanceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllowance} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedAllowance ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Allowance Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open);
        if (!open) resetAssignForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Allowance to Employee</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignEmployeeId">Employee *</Label>
              <Select
                value={assignForm.employeeId}
                onValueChange={(v) => setAssignForm({ ...assignForm, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignAllowanceId">Allowance *</Label>
              <Select
                value={assignForm.allowanceId}
                onValueChange={(v) => setAssignForm({ ...assignForm, allowanceId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select allowance" />
                </SelectTrigger>
                <SelectContent>
                  {allowances.filter((a) => a.isActive).map((allowance) => (
                    <SelectItem key={allowance.id} value={allowance.id}>
                      {allowance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignMonth">Month *</Label>
                <Input
                  id="assignMonth"
                  type="month"
                  value={assignForm.month}
                  onChange={(e) => setAssignForm({ ...assignForm, month: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignAmount">Amount (ETB) *</Label>
                <Input
                  id="assignAmount"
                  type="number"
                  step="0.01"
                  value={assignForm.amount}
                  onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignNotes">Notes</Label>
              <Textarea
                id="assignNotes"
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAllowance} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Allowance Confirmation */}
      <Dialog open={showDeleteAllowanceDialog} onOpenChange={setShowDeleteAllowanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Allowance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this allowance? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllowanceDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllowance}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllowancesPage;

