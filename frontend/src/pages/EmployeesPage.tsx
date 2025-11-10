"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Plus, Filter, Download, Mail, Phone, Calendar, Edit, Trash2, Eye, AlertCircle, Upload, FileDown, User
} from "lucide-react";
import api, { uploadDocument, bulkImportEmployees, downloadSampleTemplate } from "@/services/api"; // Axios instance with baseURL + auth
import { createUser, getRoles, type Role } from "@/services/users";

// ---------- Types ----------
type Dept = { id: string; name: string };
type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  educationLevel?: string | null;
  educationOther?: string | null;
  marriageStatus?: string | null;
  document?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  joiningDate?: string | null;
  salary?: number | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    avatarUrl?: string | null;
  } | null;
  avatarUrl?: string | null;
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

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

const resolveAvatarUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith("http")) return value;
  return `${apiBaseUrl}${value}`;
};

const formatStatusLabel = (status: Employee["status"]) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatEmploymentType = (value?: string | null) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "—";

// ---------- API calls ----------
async function apiListEmployees(params: {
  search?: string; status?: Employee["status"]; departmentId?: string; page?: number; pageSize?: number;
}) {
  const { data } = await api.get("/employees", { params });
  return data as { items: Employee[]; total: number; page: number; pageSize: number };
}
async function apiGetEmployee(id: string) {
  const { data } = await api.get(`/employees/${id}`);
  return data as Employee;
}
async function apiCreateEmployee(payload: Partial<Employee> & { firstName: string; lastName: string; email: string }) {
  const { data } = await api.post("/employees", payload);
  return data as Employee;
}
async function apiUpdateEmployee(id: string, payload: Partial<Employee>) {
  const { data } = await api.put(`/employees/${id}`, payload);
  return data as Employee;
}
async function apiDeleteEmployee(id: string) {
  await api.delete(`/employees/${id}`);
}
async function apiListDepartments() {
  const { data } = await api.get("/departments");
  return data as Dept[];
}

// ---------- Add Employee Dialog (inline component) ----------
function AddEmployeeDialog({
  departments, onCreated, canCreate
}: { departments: Dept[]; onCreated: (e: Employee) => void; canCreate: boolean }) {
  const { hasPermission } = useAuth();
  const canManageUsers = hasPermission("users.write");
  
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", designation: "", employmentType: "",
    educationLevel: "", educationOther: "", marriageStatus: "", document: "",
    departmentId: "", status: "ACTIVE" as Employee["status"],
    joiningDate: "", salary: "", address: "", emergencyContact: "",
    createUserAccount: false,
    userPassword: "",
    userConfirmPassword: "",
    userRoleId: "",
  });
  
  // Load roles when user account creation is enabled
  useEffect(() => {
    if (form.createUserAccount && canManageUsers && roles.length === 0 && !loadingRoles) {
      setLoadingRoles(true);
      getRoles()
        .then((data) => {
          setRoles(data);
        })
        .catch((err) => {
          console.error("Failed to load roles:", err);
          toast.error("Failed to load roles");
        })
        .finally(() => {
          setLoadingRoles(false);
        });
    }
  }, [form.createUserAccount, canManageUsers, roles.length, loadingRoles]);
  
  const validateField = (name: string, value: string): string => {
    if (name === "firstName" && !value.trim()) {
      return "This field is required";
    }
    if (name === "lastName" && !value.trim()) {
      return "This field is required";
    }
    if (name === "email") {
      if (!value.trim()) {
        return "This field is required";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
    }
    return "";
  };

  const onChange = (k: string, v: string | boolean) => {
    setForm(p => ({ ...p, [k]: v }));
    // Clear field error when user starts typing
    if (fieldErrors[k]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[k];
        return newErrors;
      });
    }
    // Clear general error
    if (error) setError(null);
  };

  const onBlur = (fieldName: string) => {
    const fieldValue = form[fieldName as keyof typeof form];
    if (typeof fieldValue === 'string') {
      const error = validateField(fieldName, fieldValue);
      if (error) {
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const errors: Record<string, string> = {};
    
    const firstNameError = validateField("firstName", form.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateField("lastName", form.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const emailError = validateField("email", form.email);
    if (emailError) errors.email = emailError;
    
    // If there are validation errors, set them and stop submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFieldErrors({}); // Clear field errors
      
      // Upload document if a file is selected
      let documentUrl = form.document || undefined;
      if (selectedFile) {
        try {
          setUploading(true);
          const uploadResult = await uploadDocument(selectedFile);
          documentUrl = uploadResult.url;
        } catch (uploadError: any) {
          setError(uploadError?.response?.data?.message || "Failed to upload document");
          setSubmitting(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
      
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
        designation: form.designation || undefined,
        employmentType: form.employmentType || undefined,
        educationLevel: form.educationLevel || undefined,
        educationOther: form.educationOther || undefined,
        marriageStatus: form.marriageStatus || undefined,
        document: documentUrl,
        status: form.status,
        joiningDate: form.joiningDate || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        departmentId: form.departmentId && form.departmentId.trim() !== "" ? form.departmentId : undefined,
      };
      
      const created = await apiCreateEmployee(payload as any);
      
      // Create user account if requested
      if (form.createUserAccount && canManageUsers) {
        if (!form.userPassword || form.userPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setSubmitting(false);
          return;
        }
        if (form.userPassword !== form.userConfirmPassword) {
          setError("Passwords do not match");
          setSubmitting(false);
          return;
        }
        if (!form.userRoleId) {
          setError("Please select a role for the user account");
          setSubmitting(false);
          return;
        }
        
        try {
          await createUser({
            email: form.email,
            password: form.userPassword,
            firstName: form.firstName,
            lastName: form.lastName,
            roleIds: [form.userRoleId],
            employeeId: created.id,
            status: "ACTIVE",
          });
          toast.success("Employee and user account created successfully!", {
            duration: 3000,
            description: `${created.firstName} ${created.lastName} has been added with login access.`
          });
        } catch (userError: any) {
          // Employee was created but user creation failed
          toast.warning("Employee created but user account creation failed", {
            description: userError?.response?.data?.message || "You can create a user account later from User Management."
          });
        }
      } else {
        // Show success toast
        toast.success("Employee created successfully!", {
          duration: 3000,
          description: `${created.firstName} ${created.lastName} has been added to the system.`
        });
      }
      
      // Call parent callback
      onCreated(created);
      
      // Close dialog and reset form
      setOpen(false);
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        dateOfBirth: "", gender: "", designation: "", employmentType: "",
        educationLevel: "", educationOther: "", marriageStatus: "", document: "",
        departmentId: "", status: "ACTIVE", joiningDate: "", salary: "", address: "", emergencyContact: "",
        createUserAccount: false,
        userPassword: "",
        userConfirmPassword: "",
        userRoleId: "",
      });
      setSelectedFile(null);
      setFieldErrors({});
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
      // Reset errors when closing
      setError(null);
      setFieldErrors({});
      setSelectedFile(null);
      // Reset form
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        dateOfBirth: "", gender: "", designation: "", employmentType: "",
        educationLevel: "", educationOther: "", marriageStatus: "", document: "",
        departmentId: "", status: "ACTIVE", joiningDate: "", salary: "", address: "", emergencyContact: "",
        createUserAccount: false,
        userPassword: "",
        userConfirmPassword: "",
        userRoleId: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>Fill in the new employee's details.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto pr-2">

        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={e => onChange("firstName", e.target.value)}
                  onBlur={() => onBlur("firstName")}
                  className={fieldErrors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-500">{fieldErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={e => onChange("lastName", e.target.value)}
                  onBlur={() => onBlur("lastName")}
                  className={fieldErrors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-500">{fieldErrors.lastName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={e => onChange("email", e.target.value)}
                  onBlur={() => onBlur("email")}
                  className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={e => onChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => onChange("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender || undefined} onValueChange={(v) => onChange("gender", v)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marriageStatus">Marriage Status</Label>
                <Select value={form.marriageStatus || undefined} onValueChange={(v) => onChange("marriageStatus", v)}>
                  <SelectTrigger id="marriageStatus">
                    <SelectValue placeholder="Select marriage status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="MARRIED">Married</SelectItem>
                    <SelectItem value="DIVORCED">Divorced</SelectItem>
                    <SelectItem value="WIDOWED">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={e => onChange("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Enter emergency contact"
                  value={form.emergencyContact}
                  onChange={e => onChange("emergencyContact", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="Enter designation/position"
                  value={form.designation}
                  onChange={e => onChange("designation", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={form.employmentType || undefined}
                  onValueChange={(v) => onChange("employmentType", v)}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                    <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationLevel">Education Level</Label>
                <Select
                  value={form.educationLevel || undefined}
                  onValueChange={(v) => {
                    onChange("educationLevel", v);
                    // Clear educationOther if not "OTHER" is selected
                    if (v !== "OTHER") {
                      onChange("educationOther", "");
                    }
                  }}
                >
                  <SelectTrigger id="educationLevel">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRADE_8">Grade 8</SelectItem>
                    <SelectItem value="GRADE_10">Grade 10</SelectItem>
                    <SelectItem value="GRADE_12">Grade 12</SelectItem>
                    <SelectItem value="DEGREE">Degree</SelectItem>
                    <SelectItem value="MASTER">Master</SelectItem>
                    <SelectItem value="PHD">PhD</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.educationLevel === "OTHER" && (
                  <div className="mt-2">
                    <Input
                      id="educationOther"
                      placeholder="Enter education level"
                      value={form.educationOther}
                      onChange={e => onChange("educationOther", e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  value={form.departmentId || undefined}
                  onValueChange={(v) => onChange("departmentId", v)}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => onChange("status", v as Employee["status"])}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={e => onChange("joiningDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (ETB)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  placeholder="Enter salary"
                  value={form.salary}
                  onChange={e => onChange("salary", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Document (Optional)</Label>
                <Input
                  id="document"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      onChange("document", file.name);
                    } else {
                      setSelectedFile(null);
                      onChange("document", "");
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500">Selected: {selectedFile.name}</p>
                )}
                {form.document && !selectedFile && (
                  <p className="text-sm text-gray-500">Current: {form.document}</p>
                )}
              </div>
            </div>
          </div>

          {/* User Account Creation Section */}
          {canManageUsers && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="createUserAccount" className="text-base font-semibold">Create User Account</Label>
                  <p className="text-sm text-gray-500">Enable this employee to log in to the HRMS portal</p>
                </div>
                <Switch
                  id="createUserAccount"
                  checked={form.createUserAccount}
                  onCheckedChange={(checked) => setForm({ ...form, createUserAccount: checked })}
                />
              </div>
              
              {form.createUserAccount && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userRoleId">User Role *</Label>
                      <Select
                        value={form.userRoleId}
                        onValueChange={(value) => onChange("userRoleId", value)}
                        disabled={loadingRoles}
                      >
                        <SelectTrigger id="userRoleId">
                          <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role"} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userPassword">Password *</Label>
                      <Input
                        id="userPassword"
                        type="password"
                        value={form.userPassword}
                        onChange={(e) => onChange("userPassword", e.target.value)}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userConfirmPassword">Confirm Password *</Label>
                      <Input
                        id="userConfirmPassword"
                        type="password"
                        value={form.userConfirmPassword}
                        onChange={(e) => onChange("userConfirmPassword", e.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      The user account will be created with the same email as the employee. The employee can use this email and password to log in.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {uploading ? "Uploading..." : submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Edit Employee Dialog ----------
function EditEmployeeDialog({
  employee,
  departments,
  onUpdated,
  canEdit
}: { 
  employee: Employee | null; 
  departments: Dept[]; 
  onUpdated: (e: Employee) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", designation: "", employmentType: "",
    educationLevel: "", educationOther: "", marriageStatus: "", document: "",
    departmentId: "", status: "ACTIVE" as Employee["status"],
    joiningDate: "", salary: "", address: "", emergencyContact: "",
  });

  // Initialize form when employee changes
  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : "",
        gender: employee.gender || "",
        designation: employee.designation || "",
        employmentType: employee.employmentType || "",
        educationLevel: employee.educationLevel || "",
        educationOther: employee.educationOther || "",
        marriageStatus: employee.marriageStatus || "",
        document: employee.document || "",
        departmentId: employee.departmentId || "",
        status: employee.status || "ACTIVE",
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : "",
        salary: employee.salary ? String(employee.salary) : "",
        address: employee.address || "",
        emergencyContact: employee.emergencyContact || "",
      });
      setSelectedFile(null); // Reset selected file when employee changes
      setOpen(true);
    }
  }, [employee]);

  const validateField = (name: string, value: string): string => {
    if (name === "firstName" && !value.trim()) {
      return "This field is required";
    }
    if (name === "lastName" && !value.trim()) {
      return "This field is required";
    }
    if (name === "email") {
      if (!value.trim()) {
        return "This field is required";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
    }
    return "";
  };

  const onChange = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (fieldErrors[k]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[k];
        return newErrors;
      });
    }
    if (error) setError(null);
  };

  const onBlur = (fieldName: string) => {
    const error = validateField(fieldName, form[fieldName as keyof typeof form]);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!employee) return;

    const errors: Record<string, string> = {};
    const firstNameError = validateField("firstName", form.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validateField("lastName", form.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    const emailError = validateField("email", form.email);
    if (emailError) errors.email = emailError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});

      // Upload document if a new file is selected
      let documentUrl = form.document || undefined;
      if (selectedFile) {
        try {
          setUploading(true);
          const uploadResult = await uploadDocument(selectedFile);
          documentUrl = uploadResult.url;
        } catch (uploadError: any) {
          setError(uploadError?.response?.data?.message || "Failed to upload document");
          setSubmitting(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
        designation: form.designation || undefined,
        employmentType: form.employmentType || undefined,
        educationLevel: form.educationLevel || undefined,
        educationOther: form.educationOther || undefined,
        marriageStatus: form.marriageStatus || undefined,
        document: documentUrl,
        status: form.status,
        joiningDate: form.joiningDate || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        departmentId: form.departmentId && form.departmentId.trim() !== "" ? form.departmentId : undefined,
      };

      const updated = await apiUpdateEmployee(employee.id, payload);
      toast.success("Employee updated successfully!");
      onUpdated(updated);
      setOpen(false);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || "Failed to update employee";
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (!canEdit || !employee) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update employee information</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Use the same form structure as AddEmployeeDialog */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    value={form.firstName}
                    onChange={e => onChange("firstName", e.target.value)}
                    onBlur={() => onBlur("firstName")}
                    className={fieldErrors.firstName ? "border-red-500" : ""}
                  />
                  {fieldErrors.firstName && <p className="text-sm text-red-500">{fieldErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    value={form.lastName}
                    onChange={e => onChange("lastName", e.target.value)}
                    onBlur={() => onBlur("lastName")}
                    className={fieldErrors.lastName ? "border-red-500" : ""}
                  />
                  {fieldErrors.lastName && <p className="text-sm text-red-500">{fieldErrors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={e => onChange("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                    className={fieldErrors.email ? "border-red-500" : ""}
                  />
                  {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input id="edit-phone" type="tel" value={form.phone} onChange={e => onChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                  <Input id="edit-dateOfBirth" type="date" value={form.dateOfBirth} onChange={e => onChange("dateOfBirth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select value={form.gender || undefined} onValueChange={(v) => onChange("gender", v)}>
                    <SelectTrigger id="edit-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-marriageStatus">Marriage Status</Label>
                  <Select value={form.marriageStatus || undefined} onValueChange={(v) => onChange("marriageStatus", v)}>
                    <SelectTrigger id="edit-marriageStatus">
                      <SelectValue placeholder="Select marriage status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="MARRIED">Married</SelectItem>
                      <SelectItem value="DIVORCED">Divorced</SelectItem>
                      <SelectItem value="WIDOWED">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" value={form.address} onChange={e => onChange("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                  <Input id="edit-emergencyContact" value={form.emergencyContact} onChange={e => onChange("emergencyContact", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-designation">Designation</Label>
                  <Input id="edit-designation" value={form.designation} onChange={e => onChange("designation", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employmentType">Employment Type</Label>
                  <Select value={form.employmentType || undefined} onValueChange={(v) => onChange("employmentType", v)}>
                    <SelectTrigger id="edit-employmentType">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERN">Intern</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-educationLevel">Education Level</Label>
                  <Select
                    value={form.educationLevel || undefined}
                    onValueChange={(v) => {
                      onChange("educationLevel", v);
                      if (v !== "OTHER") {
                        onChange("educationOther", "");
                      }
                    }}
                  >
                    <SelectTrigger id="edit-educationLevel">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRADE_8">Grade 8</SelectItem>
                      <SelectItem value="GRADE_10">Grade 10</SelectItem>
                      <SelectItem value="GRADE_12">Grade 12</SelectItem>
                      <SelectItem value="DEGREE">Degree</SelectItem>
                      <SelectItem value="MASTER">Master</SelectItem>
                      <SelectItem value="PHD">PhD</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.educationLevel === "OTHER" && (
                    <div className="mt-2">
                      <Input
                        id="edit-educationOther"
                        placeholder="Enter education level"
                        value={form.educationOther}
                        onChange={e => onChange("educationOther", e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-departmentId">Department</Label>
                  <Select value={form.departmentId || undefined} onValueChange={(v) => onChange("departmentId", v)}>
                    <SelectTrigger id="edit-departmentId">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={form.status} onValueChange={(v) => onChange("status", v as Employee["status"])}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-joiningDate">Joining Date</Label>
                  <Input id="edit-joiningDate" type="date" value={form.joiningDate} onChange={e => onChange("joiningDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salary (ETB)</Label>
                  <Input id="edit-salary" type="number" step="0.01" value={form.salary} onChange={e => onChange("salary", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-document">Document (Optional)</Label>
                  {form.document && !selectedFile && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Current document:</span> {form.document.split('/').pop()}
                      </p>
                      <a
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}${form.document}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        View/Download
                      </a>
                    </div>
                  )}
                  <Input
                    id="edit-document"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        onChange("document", file.name);
                      } else {
                        setSelectedFile(null);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500">New file selected: {selectedFile.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedFile ? "Select a new file to replace the current document" : "Select a file to upload"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {uploading ? "Uploading..." : submitting ? "Saving..." : "Save Changes"}
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ total: number; successful: number; failed: number; errors: Array<{ row: number; email?: string; error: string }> } | null>(null);

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

  const handleEmployeeUpdated = (updated: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      await apiDeleteEmployee(deletingEmployee.id);
      toast.success("Employee deleted successfully");
      setEmployees(prev => prev.filter(emp => emp.id !== deletingEmployee.id));
      setDeletingEmployee(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete employee");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage and view employee information</p>
        </div>
        
        <div className="flex gap-2">
          {canWrite && (
            <Button variant="outline" onClick={() => {
              setImportDialog(true);
              setImportFile(null);
              setImportResults(null);
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Import Bulk
            </Button>
          )}
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
                {filteredEmployees.map((e) => {
                  const avatarSrc = resolveAvatarUrl(e.avatarUrl ?? e.user?.avatarUrl ?? null);
                  return (
                    <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          {avatarSrc && (
                            <AvatarImage src={avatarSrc} alt={`${e.firstName} ${e.lastName}`} />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            {initials(e.firstName, e.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{e.firstName} {e.lastName}</p>
                          <p className="text-sm text-gray-500">{e.designation ?? "—"}</p>
                          <p className="text-xs text-gray-400">{e.employeeCode}</p>
                          {e.userId && e.user?.status === "ACTIVE" && (
                            <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                              Has Account
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.department?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(toUiStatus(e.status))}>
                        {formatStatusLabel(e.status)}
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
                            <div className="space-y-6 py-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    {avatarSrc && (
                                      <AvatarImage src={avatarSrc} alt={`${e.firstName} ${e.lastName}`} />
                                    )}
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                      {initials(e.firstName, e.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-lg font-semibold text-foreground">
                                      {e.firstName} {e.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {e.designation ?? "—"}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <Badge variant="outline">{e.department?.name ?? "—"}</Badge>
                                      <Badge className={getStatusColor(toUiStatus(e.status))}>
                                        {formatStatusLabel(e.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Joined {e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "—"}
                                    </span>
                                  </div>
                                  {e.manager && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>
                                        Manager: {e.manager.firstName} {e.manager.lastName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2 bg-muted/40 rounded-lg p-4">
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Employee ID</span>
                                  <span className="font-medium text-foreground">{e.employeeCode}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Employment Type</span>
                                  <span className="font-medium text-foreground">{formatEmploymentType(e.employmentType)}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Email</span>
                                  <span className="font-medium text-foreground break-all">{e.email}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Phone</span>
                                  <span className="font-medium text-foreground">{e.phone ?? "—"}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Emergency Contact</span>
                                  <span className="font-medium text-foreground">{e.emergencyContact ?? "—"}</span>
                                </div>
                                <div className="flex flex-col text-sm">
                                  <span className="text-xs uppercase text-muted-foreground">Education</span>
                                  <span className="font-medium text-foreground">
                                    {e.educationLevel === "OTHER"
                                      ? e.educationOther ?? "—"
                                      : formatEmploymentType(e.educationLevel)}
                                  </span>
                                </div>
                              </div>
                              <div className="grid gap-6 sm:grid-cols-2 text-sm text-muted-foreground">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-foreground">Personal</h4>
                                  <p><span className="font-medium text-foreground">Address:</span> {e.address ?? "—"}</p>
                                  <p><span className="font-medium text-foreground">Date of Birth:</span> {e.dateOfBirth ? new Date(e.dateOfBirth).toLocaleDateString() : "—"}</p>
                                  <p><span className="font-medium text-foreground">Gender:</span> {e.gender ? formatEmploymentType(e.gender) : "—"}</p>
                                  <p><span className="font-medium text-foreground">Marital Status:</span> {e.marriageStatus ? formatEmploymentType(e.marriageStatus) : "—"}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-foreground">Professional</h4>
                                  <p><span className="font-medium text-foreground">Status:</span> {formatStatusLabel(e.status)}</p>
                                  <p><span className="font-medium text-foreground">Salary:</span> {e.salary != null ? `ETB ${Number(e.salary).toLocaleString()}` : "—"}</p>
                                  {e.document && (
                                    <p className="flex items-center gap-2">
                                      <Download className="h-3 w-3" />
                                      <a
                                        href={`${apiBaseUrl}${e.document}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View document
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {hasPermission("employees.write") && (
                      <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingEmployee(e)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeletingEmployee(e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Edit Employee Dialog */}
      <EditEmployeeDialog
        employee={editingEmployee}
        departments={departments}
        onUpdated={handleEmployeeUpdated}
        canEdit={canWrite}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingEmployee?.firstName} {deletingEmployee?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeletingEmployee(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmployee}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importDialog} onOpenChange={(open) => {
        setImportDialog(open);
        if (!open) {
          setImportFile(null);
          setImportResults(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Employees</DialogTitle>
            <DialogDescription>
              Upload a CSV file with employee data to import multiple employees at once
            </DialogDescription>
          </DialogHeader>

          {!importResults ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Instructions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Download the sample template to see the required format</li>
                    <li>Required fields: firstName, lastName, email</li>
                    <li>All employees will automatically get user accounts with EMPLOYEE role</li>
                    <li>Default password format: {`{email}{employeeCode}`}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await downloadSampleTemplate();
                      toast.success("Sample template downloaded successfully");
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Failed to download sample template");
                    }
                  }}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Sample Template
                </Button>
              </div>

              <div>
                <Label htmlFor="import-file">Select CSV File *</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                    }
                  }}
                  className="mt-2"
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setImportDialog(false)} disabled={importing}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!importFile) {
                      toast.error("Please select a file to import");
                      return;
                    }

                    try {
                      setImporting(true);
                      const result = await bulkImportEmployees(importFile);
                      setImportResults(result.results);
                      
                      if (result.results.successful > 0) {
                        toast.success(`Successfully imported ${result.results.successful} employee(s)`);
                        // Reload employees list
                        const [deps, empRes] = await Promise.all([
                          apiListDepartments(),
                          apiListEmployees({ page: 1, pageSize: 200 })
                        ]);
                        setDepartments(deps);
                        setEmployees(empRes.items);
                      }
                      
                      if (result.results.failed > 0) {
                        toast.warning(`${result.results.failed} employee(s) failed to import. Check errors below.`);
                      }
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Failed to import employees");
                    } finally {
                      setImporting(false);
                    }
                  }}
                  disabled={!importFile || importing}
                >
                  {importing ? (
                    <>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant={importResults.failed > 0 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Results:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Total: {importResults.total}</li>
                    <li>Successful: {importResults.successful}</li>
                    <li>Failed: {importResults.failed}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {importResults.errors.length > 0 && (
                <div>
                  <Label>Errors ({importResults.errors.length}):</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                    {importResults.errors.map((error, idx) => (
                      <div key={idx} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                        <p className="font-medium">Row {error.row}</p>
                        {error.email && <p className="text-xs text-gray-600">Email: {error.email}</p>}
                        <p className="text-xs text-red-600 mt-1">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setImportDialog(false);
                  setImportFile(null);
                  setImportResults(null);
                }}>
                  Close
                </Button>
                {importResults.successful > 0 && (
                  <Button onClick={() => {
                    setImportDialog(false);
                    setImportFile(null);
                    setImportResults(null);
                  }}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
