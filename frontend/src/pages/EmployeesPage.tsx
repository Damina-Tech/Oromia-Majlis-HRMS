"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Plus, Filter, Download, Mail, Phone, Calendar, Edit, Trash2, Eye, AlertCircle
} from "lucide-react";
import api from "@/services/api"; // Axios instance with baseURL + auth

// ---------- Types ----------
type Dept = { id: string; name: string };
type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  designation?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  joiningDate?: string | null;
  salary?: number | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
};

// ---------- Helpers ----------
const toUiStatus = (s: Employee["status"]) =>
  s === "ACTIVE" ? "active" : s === "INACTIVE" ? "inactive" : "on-leave";

const fromUiStatus = (s: "active" | "inactive" | "on-leave"): Employee["status"] =>
  s === "active" ? "ACTIVE" : s === "inactive" ? "INACTIVE" : "ON_LEAVE";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "inactive": return "bg-red-100 text-red-800";
    case "on-leave": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};
const initials = (first = "", last = "") => (first[0] ?? "").toUpperCase() + (last[0] ?? "").toUpperCase();

// ---------- API calls ----------
async function apiListEmployees(params: {
  search?: string; status?: Employee["status"]; departmentId?: string; page?: number; pageSize?: number;
}) {
  const { data } = await api.get("/employees", { params });
  return data as { items: Employee[]; total: number; page: number; pageSize: number };
}
async function apiCreateEmployee(payload: Partial<Employee> & { firstName: string; lastName: string; email: string }) {
  const { data } = await api.post("/employees", payload);
  return data as Employee;
}
async function apiListDepartments() {
  const { data } = await api.get("/departments");
  return data as Dept[];
}

// ---------- Add Employee Dialog (inline component) ----------
function AddEmployeeDialog({
  departments, onCreated, canCreate
}: { departments: Dept[]; onCreated: (e: Employee) => void; canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    designation: "", departmentId: "", status: "ACTIVE" as Employee["status"],
    joiningDate: "", salary: "", address: "", emergencyContact: "",
  });
  const onChange = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
        departmentId: form.departmentId || undefined,
        joiningDate: form.joiningDate || undefined,
      };
      
      const created = await apiCreateEmployee(payload as any);
      
      // Show success toast
      toast.success("Employee created successfully!", {
        duration: 3000,
        description: `${created.firstName} ${created.lastName} has been added to the system.`
      });
      
      // Call parent callback
      onCreated(created);
      
      // Close dialog and reset form
      setOpen(false);
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        designation: "", departmentId: "", status: "ACTIVE", joiningDate: "", salary: "", address: "", emergencyContact: "",
      });
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || "Failed to create employee";
      
      // Check for duplicate email error
      if (errorMessage.includes("email") || errorMessage.includes("Unique constraint")) {
        setError("An employee with this email already exists in the system.");
      } else {
        setError(errorMessage);
      }
      
      // Don't close the dialog on error
      setSubmitting(false);
    } finally {
      if (!error) {
        setSubmitting(false);
      }
    }
  };

  if (!canCreate) return null;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset error when closing
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>Fill in the new employee's details.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="First name*" value={form.firstName} onChange={e=>onChange("firstName", e.target.value)} />
          <Input placeholder="Last name*" value={form.lastName} onChange={e=>onChange("lastName", e.target.value)} />
          <Input placeholder="Email*" type="email" value={form.email} onChange={e=>onChange("email", e.target.value)} />
          <Input placeholder="Phone" value={form.phone} onChange={e=>onChange("phone", e.target.value)} />
          <Input placeholder="Designation" value={form.designation} onChange={e=>onChange("designation", e.target.value)} />
          <Select value={form.departmentId || undefined} onValueChange={(v)=>onChange("departmentId", v)}>
            <SelectTrigger><SelectValue placeholder="Department (Optional)" /></SelectTrigger>
            <SelectContent>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.status} onValueChange={(v)=>onChange("status", v as Employee["status"])}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" placeholder="Joining date" value={form.joiningDate} onChange={e=>onChange("joiningDate", e.target.value)} />
          <Input type="number" step="0.01" placeholder="Salary (ETB)" value={form.salary} onChange={e=>onChange("salary", e.target.value)} />
          <Input placeholder="Address" value={form.address} onChange={e=>onChange("address", e.target.value)} />
          <Input placeholder="Emergency contact" value={form.emergencyContact} onChange={e=>onChange("emergencyContact", e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Page ----------
const EmployeesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("employees.write");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all"); // stores deptId or 'all'
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "on-leave">("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(false);

  // Load deps & employees
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [deps, empRes] = await Promise.all([
          apiListDepartments(),
          apiListEmployees({ page: 1, pageSize: 200 })
        ]);
        setDepartments(deps);
        setEmployees(empRes.items);
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Client-side filtering to keep your UX
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const fullName = `${e.firstName} ${e.lastName}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === "all" || e.departmentId === departmentFilter;

      const uiStatus = toUiStatus(e.status);
      const matchesStatus =
        statusFilter === "all" || uiStatus === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const totals = useMemo(() => {
    const active = employees.filter(e => e.status === "ACTIVE").length;
    const onLeave = employees.filter(e => e.status === "ON_LEAVE").length;
    return { total: employees.length, active, onLeave, departments: departments.length };
  }, [employees, departments]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage and view employee information</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <AddEmployeeDialog
            departments={departments}
            onCreated={(emp) => setEmployees(prev => [emp, ...prev])}
            canCreate={!!canWrite}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold">{totals.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold">{totals.active}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold">{totals.onLeave}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold">{totals.departments}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Search and filter employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department filter uses deptId */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter keeps your UI values */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            {initials(e.firstName, e.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{e.firstName} {e.lastName}</p>
                          <p className="text-sm text-gray-500">{e.designation ?? "—"}</p>
                          <p className="text-xs text-gray-400">{e.employeeCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.department?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(toUiStatus(e.status))}>
                        {toUiStatus(e.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-2" />
                          {e.email}
                        </div>
                        {e.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-2" />
                            {e.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmployee(e)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Employee Details</DialogTitle>
                              <DialogDescription>
                                Complete information for {e.firstName} {e.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-6 py-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-gray-900">Personal Information</h4>
                                  <div className="mt-2 space-y-2 text-sm">
                                    <p><span className="font-medium">Name:</span> {e.firstName} {e.lastName}</p>
                                    <p><span className="font-medium">Email:</span> {e.email}</p>
                                    <p><span className="font-medium">Phone:</span> {e.phone ?? "—"}</p>
                                    <p><span className="font-medium">Address:</span> {e.address ?? "—"}</p>
                                    <p><span className="font-medium">Emergency Contact:</span> {e.emergencyContact ?? "—"}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-gray-900">Professional Information</h4>
                                  <div className="mt-2 space-y-2 text-sm">
                                    <p><span className="font-medium">Employee ID:</span> {e.employeeCode}</p>
                                    <p><span className="font-medium">Department:</span> {e.department?.name ?? "—"}</p>
                                    <p><span className="font-medium">Designation:</span> {e.designation ?? "—"}</p>
                                    <p><span className="font-medium">Manager:</span> {e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : "N/A"}</p>
                                    <p><span className="font-medium">Joining Date:</span> {e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "—"}</p>
                                    <p><span className="font-medium">Salary:</span> {typeof e.salary === "number" ? `ETB ${e.salary.toLocaleString()}` : "—"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {hasPermission("employees.write") && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => toast.info("Hook delete here (api DELETE /employees/:id)")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No employees found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;
