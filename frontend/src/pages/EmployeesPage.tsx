 "use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Upload,
  FileDown,
  User,
  IdCard,
  Sparkles,
  Printer,
} from "lucide-react";
import api, { uploadDocument, bulkImportEmployees, downloadSampleTemplate } from "@/services/api"; // Axios instance with baseURL + auth
import { getRoles, type Role } from "@/services/users";
import {
  listIdCardTemplates,
  createIdCardTemplate,
  updateIdCardTemplate,
  setDefaultIdCardTemplate,
  generateEmployeeIdCard as requestGenerateIdCard,
  batchGenerateIdCards,
  type IdCardTemplate,
  type IdCardTemplateSettings,
} from "@/services/employeeId";
import IdCardPreview from "@/components/employees/IdCardPreview";

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
  educationField?: string | null;
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
  idCardGeneratedAt?: string | null;
  idCardTemplateId?: string | null;
  idCardPdfUrl?: string | null;
  idCardPngUrl?: string | null;
};

type EmployeeListSummary = {
  totalEmployees: number;
  active: number;
  inactive: number;
  onLeave: number;
  departments: number;
};

type EmployeeListResponse = {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  summary?: EmployeeListSummary;
};

type TemplateFormState = {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  settings: IdCardTemplateSettings;
};

const DEFAULT_EMPLOYEE_SUMMARY: EmployeeListSummary = {
  totalEmployees: 0,
  active: 0,
  inactive: 0,
  onLeave: 0,
  departments: 0,
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

const resolveFileUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith("http")) return value;
  return `${apiBaseUrl}${value}`;
};

const formatStatusLabel = (status: Employee["status"]) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatEmploymentType = (value?: string | null) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "—";

const ADVANCED_EDUCATION_LEVELS = ["DEGREE", "MASTER", "PHD"] as const;
const requiresEducationField = (level?: string | null) =>
  !!level && ADVANCED_EDUCATION_LEVELS.includes(level as typeof ADVANCED_EDUCATION_LEVELS[number]);

const DEFAULT_TEMPLATE_SETTINGS: IdCardTemplateSettings = {
  size: "ID1",
  background: { type: "color", value: "#ffffff" },
  border: { width: 2, color: "#111827", radius: 20 },
  text: { color: "#0f172a", fontFamily: "Inter, sans-serif", fontSize: 14, headingSize: 22 },
  layout: "PHOTO_LEFT",
  fieldVisibility: {
    showEmployeeName: true,
    showJobTitle: true,
    showDepartment: true,
    showEmployeeCode: true,
    showPhoto: true,
    showCompanyLogo: true,
    showIssueDate: true,
    showExpiryDate: false,
    showBarcode: true,
    showSignature: false,
    showStamp: false,
  },
  assets: {},
  extraLines: ["{{department}}", "ID: {{employeeCode}}"],
  codeType: "QR",
};

const normalizeSettings = (input?: IdCardTemplateSettings): IdCardTemplateSettings => ({
  ...DEFAULT_TEMPLATE_SETTINGS,
  ...input,
  border: { ...DEFAULT_TEMPLATE_SETTINGS.border, ...(input?.border ?? {}) },
  text: { ...DEFAULT_TEMPLATE_SETTINGS.text, ...(input?.text ?? {}) },
  fieldVisibility: { ...DEFAULT_TEMPLATE_SETTINGS.fieldVisibility, ...(input?.fieldVisibility ?? {}) },
  assets: { ...(input?.assets ?? {}) },
  extraLines: input?.extraLines ?? DEFAULT_TEMPLATE_SETTINGS.extraLines,
});

const buildTemplateForm = (template?: IdCardTemplate): TemplateFormState => ({
  id: template?.id,
  name: template?.name ?? "New template",
  description: template?.description ?? "",
  isDefault: template?.isDefault ?? false,
  settings: normalizeSettings(template?.settings),
});

// ---------- API calls ----------
async function apiListEmployees(params: {
  search?: string;
  status?: Employee["status"];
  departmentId?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmployeeListResponse> {
  const { data } = await api.get("/employees", { params });
  return data as EmployeeListResponse;
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
  const [defaultCreateUserAccount, setDefaultCreateUserAccount] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("hrms_employee_default_create_account") === "true";
  });

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", designation: "", employmentType: "",
    educationLevel: "", educationOther: "", educationField: "", marriageStatus: "", document: "",
    departmentId: "", status: "ACTIVE" as Employee["status"],
    joiningDate: "", salary: "", address: "", emergencyContact: "",
    createUserAccount: defaultCreateUserAccount,
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
    if (name === "educationField" && requiresEducationField(form.educationLevel) && !value.trim()) {
      return "Please specify the education field or major";
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

    if (requiresEducationField(form.educationLevel) && !form.educationField.trim()) {
      errors.educationField = "Please specify the education field or major";
    }
    
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
        educationField: form.educationField || undefined,
        marriageStatus: form.marriageStatus || undefined,
        document: documentUrl,
        status: form.status,
        joiningDate: form.joiningDate || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        departmentId: form.departmentId && form.departmentId.trim() !== "" ? form.departmentId : undefined,
      };

      if (form.createUserAccount && canManageUsers) {
        payload.createUserAccount = true;
        payload.userPassword = form.userPassword;
        payload.userRoleId = form.userRoleId;
      }
      
      const created = await apiCreateEmployee(payload as any);

      toast.success(
        created?.user
          ? "Employee and user account created successfully!"
          : "Employee created successfully!",
        {
          duration: 3000,
          description: `${created.firstName} ${created.lastName} has been added${
            created?.user ? " with login access." : " to the system."
          }`,
        }
      );
      
      // Call parent callback
      onCreated(created);
      
      // Close dialog and reset form
      setOpen(false);
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        dateOfBirth: "", gender: "", designation: "", employmentType: "",
        educationLevel: "", educationOther: "", educationField: "", marriageStatus: "", document: "",
        departmentId: "", status: "ACTIVE", joiningDate: "", salary: "", address: "", emergencyContact: "",
        createUserAccount: defaultCreateUserAccount,
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
      setSubmitting(false);
    }
  };

  if (!canCreate) return null;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      if (typeof window !== "undefined") {
        const storedDefault = localStorage.getItem("hrms_employee_default_create_account");
        const nextDefault = storedDefault === "true";
        setDefaultCreateUserAccount(nextDefault);
        setForm((prev) => ({
          ...prev,
          createUserAccount: nextDefault,
        }));
      }
      setError(null);
      setFieldErrors({});
      setSelectedFile(null);
    } else {
      setError(null);
      setFieldErrors({});
      setSelectedFile(null);
      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        dateOfBirth: "", gender: "", designation: "", employmentType: "",
        educationLevel: "", educationOther: "", educationField: "", marriageStatus: "", document: "",
        departmentId: "", status: "ACTIVE", joiningDate: "", salary: "", address: "", emergencyContact: "",
        createUserAccount: defaultCreateUserAccount,
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
                    if (!requiresEducationField(v)) {
                      onChange("educationField", "");
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
                {requiresEducationField(form.educationLevel) && (
                  <div className="mt-2 space-y-2">
                    <Label htmlFor="educationField">Field / Major *</Label>
                    <Input
                      id="educationField"
                      placeholder="e.g. Computer Science"
                      value={form.educationField}
                      onChange={(e) => onChange("educationField", e.target.value)}
                      onBlur={() => onBlur("educationField")}
                      className={fieldErrors.educationField ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {fieldErrors.educationField && (
                      <p className="text-sm text-red-500">{fieldErrors.educationField}</p>
                    )}
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
    educationLevel: "", educationOther: "", educationField: "", marriageStatus: "", document: "",
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
        educationField: employee.educationField || "",
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
    if (name === "educationField" && requiresEducationField(form.educationLevel) && !value.trim()) {
      return "Please specify the education field or major";
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

    if (requiresEducationField(form.educationLevel) && !form.educationField.trim()) {
      errors.educationField = "Please specify the education field or major";
    }

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
        educationField: form.educationField || undefined,
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
                      if (!requiresEducationField(v)) {
                        onChange("educationField", "");
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
                  {requiresEducationField(form.educationLevel) && (
                    <div className="mt-2 space-y-2">
                      <Label htmlFor="edit-educationField">Field / Major *</Label>
                      <Input
                        id="edit-educationField"
                        placeholder="e.g. Computer Science"
                        value={form.educationField}
                        onChange={e => onChange("educationField", e.target.value)}
                        onBlur={() => onBlur("educationField")}
                        className={fieldErrors.educationField ? "border-red-500" : ""}
                      />
                      {fieldErrors.educationField && (
                        <p className="text-sm text-red-500">{fieldErrors.educationField}</p>
                      )}
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
  const canManageId = hasPermission("employees.id.manage");
  const canGenerateId = canManageId || hasPermission("employees.id.generate");
  const canBatchGenerate = canManageId || hasPermission("employees.id.batch");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "on-leave">("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return 10;
    const stored = Number(localStorage.getItem("hrms_employee_page_size"));
    return stored && !Number.isNaN(stored) ? stored : 10;
  });
  const [total, setTotal] = useState(0);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeListSummary>(DEFAULT_EMPLOYEE_SUMMARY);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ total: number; successful: number; failed: number; errors: Array<{ row: number; email?: string; error: string }> } | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const [idTemplates, setIdTemplates] = useState<IdCardTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(() => buildTemplateForm());
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState<Record<string, boolean>>({});

  const [idDialogOpen, setIdDialogOpen] = useState(false);
  const [idDialogEmployee, setIdDialogEmployee] = useState<Employee | null>(null);
  const [idDialogTemplateId, setIdDialogTemplateId] = useState<string | null>(null);
  const [idDialogIssueDate, setIdDialogIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [idDialogExpiryDate, setIdDialogExpiryDate] = useState<string>("");
  const [idGenerating, setIdGenerating] = useState(false);
  const [idResult, setIdResult] = useState<{ pdfUrl: string; pngUrl: string } | null>(null);

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchTemplateId, setBatchTemplateId] = useState<string | null>(null);
  const [batchIssueDate, setBatchIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [batchExpiryDate, setBatchExpiryDate] = useState<string>("");
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchZipUrl, setBatchZipUrl] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!canGenerateId) return;
    setTemplatesLoading(true);
    try {
      const data = await listIdCardTemplates();
      setIdTemplates(data);
      setActiveTemplateId((prev) => {
        const fallback =
          data.find((tpl) => tpl.id === prev) ?? data.find((tpl) => tpl.isDefault) ?? data[0] ?? null;
        setTemplateForm(buildTemplateForm(fallback ?? undefined));
        return fallback?.id ?? null;
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to load ID templates");
    } finally {
      setTemplatesLoading(false);
    }
  }, [canGenerateId, toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deps = await apiListDepartments();
        if (cancelled) return;
        setDepartments(deps);
        setEmployeeSummary((prev) => ({
          ...prev,
          departments: deps.length,
        }));
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.response?.data?.message ?? "Failed to load departments");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncPageSize = () => {
      const stored = Number(localStorage.getItem("hrms_employee_page_size"));
      if (!Number.isNaN(stored) && stored > 0 && stored !== pageSize) {
        setPageSize(stored);
        setPage(1);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "hrms_employee_page_size") {
        syncPageSize();
      }
    };
    const handleCustomUpdate = () => syncPageSize();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("hrms:employee-settings-update", handleCustomUpdate as EventListener);
    syncPageSize();
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("hrms:employee-settings-update", handleCustomUpdate as EventListener);
    };
  }, [pageSize]);

  useEffect(() => {
    let cancelled = false;
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await apiListEmployees({
          search: debouncedSearch || undefined,
          departmentId: departmentFilter === "all" ? undefined : departmentFilter,
          status:
            statusFilter === "all"
              ? undefined
              : (statusFilter.replace("-", "_").toUpperCase() as Employee["status"]),
          page,
          pageSize,
        });

        if (cancelled) return;

        setEmployees(response.items);
        setTotal(response.total);

        const summary = response.summary ?? DEFAULT_EMPLOYEE_SUMMARY;
        setEmployeeSummary({
          ...summary,
          departments: summary.departments || departments.length,
        });
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e?.response?.data?.message ?? "Failed to load employees");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, departmentFilter, statusFilter, page, pageSize, reloadKey, departments.length]);

  useEffect(() => {
    setSelectedEmployeeIds((prev) =>
      prev.filter((id) => employees.some((emp) => emp.id === id && emp.status === "ACTIVE"))
    );
  }, [employees]);

  useEffect(() => {
    if (!canGenerateId) return;
    loadTemplates();
  }, [canGenerateId, loadTemplates]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [total, pageSize, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * pageSize, total);
  const previewEmployee = useMemo(
    () => employees.find((emp) => emp.status === "ACTIVE") ?? employees[0] ?? null,
    [employees]
  );
  const selectableEmployeeIds = useMemo(
    () => employees.filter((emp) => emp.status === "ACTIVE").map((emp) => emp.id),
    [employees]
  );
  const allSelected =
    selectableEmployeeIds.length > 0 && selectedEmployeeIds.length === selectableEmployeeIds.length;

  const selectedTemplate = useMemo(() => {
    if (!idTemplates.length) return null;
    return (
      idTemplates.find((tpl) => tpl.id === idDialogTemplateId) ||
      idTemplates.find((tpl) => tpl.isDefault) ||
      idTemplates[0]
    );
  }, [idDialogTemplateId, idTemplates]);
  const baseColumnCount = 6;
  const tableColumnCount = canBatchGenerate ? baseColumnCount + 1 : baseColumnCount;

  const handleEmployeeUpdated = (updated: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
    setEditingEmployee(null);
    setReloadKey((key) => key + 1);
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      await apiDeleteEmployee(deletingEmployee.id);
      toast.success("Employee deleted successfully");
      setDeletingEmployee(null);
      setEmployees(prev => prev.filter(emp => emp.id !== deletingEmployee.id));
      setReloadKey((key) => key + 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete employee");
    }
  };

  const toggleEmployeeSelection = (employeeId: string, checked: boolean) => {
    setSelectedEmployeeIds((prev) => {
      if (checked) {
        if (prev.includes(employeeId)) return prev;
        return [...prev, employeeId];
      }
      return prev.filter((id) => id !== employeeId);
    });
  };

  const toggleSelectAllEmployees = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(selectableEmployeeIds);
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleTemplateFieldChange = <T extends keyof TemplateFormState>(field: T, value: TemplateFormState[T]) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateSettingsChange = <T extends keyof IdCardTemplateSettings>(
    field: T,
    value: IdCardTemplateSettings[T]
  ) => {
    setTemplateForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleTemplateToggle = (field: keyof IdCardTemplateSettings["fieldVisibility"], value: boolean) => {
    setTemplateForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        fieldVisibility: {
          ...prev.settings.fieldVisibility,
          [field]: value,
        },
      },
    }));
  };

  const handleAssetUpload = useCallback(async (
    field: "logoUrl" | "signatureUrl" | "stampUrl" | "backgroundUrl",
    file: File
  ) => {
    setUploadingAssets((prev) => ({ ...prev, [field]: true }));
    try {
      const result = await uploadDocument(file);
      setTemplateForm((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          assets: {
            ...prev.settings.assets,
            [field]: result.url,
          },
        },
      }));
      toast.success(`${field === "logoUrl" ? "Logo" : field === "signatureUrl" ? "Signature" : field === "stampUrl" ? "Stamp" : "Background"} uploaded successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? `Failed to upload ${field}`);
    } finally {
      setUploadingAssets((prev) => ({ ...prev, [field]: false }));
    }
  }, []);

  const handleTemplateSave = async () => {
    if (!templateForm.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setTemplateSaving(true);
    try {
      const payload = {
        name: templateForm.name.trim(),
        description: templateForm.description?.trim() || undefined,
        settings: templateForm.settings,
        isDefault: templateForm.isDefault,
      };
      if (templateForm.id) {
        await updateIdCardTemplate(templateForm.id, payload);
        toast.success("Template updated");
      } else {
        await createIdCardTemplate(payload);
        toast.success("Template created");
      }
      await loadTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to save template");
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      await setDefaultIdCardTemplate(templateId);
      toast.success("Default ID template updated");
      await loadTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to update default");
    }
  };

  const openGenerateDialog = (employee: Employee) => {
    if (!canGenerateId) return;
    const fallbackTemplate =
      idTemplates.find((tpl) => tpl.isDefault) ?? idTemplates.find((tpl) => tpl.id === activeTemplateId) ?? idTemplates[0];
    setIdDialogEmployee(employee);
    setIdDialogTemplateId(fallbackTemplate?.id ?? null);
    setIdDialogIssueDate(new Date().toISOString().slice(0, 10));
    setIdDialogExpiryDate("");
    setIdResult(null);
    setIdDialogOpen(true);
  };

  const handleGenerateIdCard = async () => {
    if (!idDialogEmployee || !idDialogTemplateId) {
      toast.error("Select a template");
      return;
    }
    setIdGenerating(true);
    try {
      const response = await requestGenerateIdCard(idDialogEmployee.id, {
        templateId: idDialogTemplateId,
        issueDate: idDialogIssueDate || undefined,
        expiryDate: idDialogExpiryDate || undefined,
      });
      setIdResult({ pdfUrl: response.pdfUrl, pngUrl: response.pngUrl });
      toast.success("ID card generated");
      setReloadKey((key) => key + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to generate ID card");
    } finally {
      setIdGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!selectedEmployeeIds.length) {
      toast.error("Select at least one active employee");
      return;
    }
    if (!batchTemplateId) {
      toast.error("Select a template for batch generation");
      return;
    }
    setBatchGenerating(true);
    try {
      const response = await batchGenerateIdCards({
        templateId: batchTemplateId,
        employeeIds: selectedEmployeeIds,
        issueDate: batchIssueDate || undefined,
        expiryDate: batchExpiryDate || undefined,
      });
      setBatchZipUrl(response.zipUrl);
      toast.success(`Generated ${response.results.length} ID cards`);
      setSelectedEmployeeIds([]);
      setReloadKey((key) => key + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Batch generation failed");
    } finally {
      setBatchGenerating(false);
    }
  };

  const handlePrintIdCard = () => {
    if (!idResult) return;
    const pdfUrl = resolveFileUrl(idResult.pdfUrl);
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage and view employee information</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canGenerateId && (
            <Button variant="outline" size="sm" onClick={() => setTemplateSheetOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              ID Settings
            </Button>
          )}
          {canBatchGenerate && (
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedEmployeeIds.length || !idTemplates.length}
              onClick={() => {
                setBatchDialogOpen(true);
                setBatchTemplateId(
                  idTemplates.find((tpl) => tpl.isDefault)?.id ??
                    idTemplates[0]?.id ??
                    null
                );
                setBatchZipUrl(null);
              }}
            >
              <IdCard className="mr-2 h-4 w-4" />
              Batch IDs
            </Button>
          )}
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportDialog(true);
                setImportFile(null);
                setImportResults(null);
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Bulk
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <AddEmployeeDialog
            departments={departments}
            onCreated={() => {
              setPage(1);
              setReloadKey((key) => key + 1);
            }}
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
              <p className="text-2xl font-bold">{employeeSummary.totalEmployees.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{employeeSummary.active.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{employeeSummary.onLeave.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{employeeSummary.departments.toLocaleString()}</p>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (page !== 1) setPage(1);
                }}
                className="pl-10"
              />
            </div>
            
            {/* Department filter uses deptId */}
            <Select
              value={departmentFilter}
              onValueChange={(value) => {
                setDepartmentFilter(value);
                setPage(1);
              }}
            >
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as typeof statusFilter);
                setPage(1);
              }}
            >
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
                  {canBatchGenerate && (
                    <TableHead className="w-8">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => toggleSelectAllEmployees(checked === true)}
                        aria-label="Select all employees"
                      />
                    </TableHead>
                  )}
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => {
                  const avatarSrc = resolveAvatarUrl(e.avatarUrl ?? e.user?.avatarUrl ?? null);
                  return (
                    <TableRow key={e.id}>
                    {canBatchGenerate && (
                      <TableCell className="w-8">
                        <Checkbox
                          checked={selectedEmployeeIds.includes(e.id)}
                          onCheckedChange={(checked) => toggleEmployeeSelection(e.id, checked === true)}
                          disabled={e.status !== "ACTIVE"}
                          aria-label={`Select ${e.firstName}`}
                        />
                      </TableCell>
                    )}
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
                          {e.idCardGeneratedAt && (
                            <Badge variant="secondary" className="mt-1 text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              ID ready
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
                                    {e.educationField && (
                                      <span className="block text-xs text-muted-foreground mt-1">
                                        Field: {e.educationField}
                                      </span>
                                    )}
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
                                        href={resolveFileUrl(e.document)}
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
                              <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">ID Card</p>
                                    <p className="text-xs text-muted-foreground">
                                      {e.idCardGeneratedAt
                                        ? `Generated ${formatDistanceToNow(new Date(e.idCardGeneratedAt), {
                                            addSuffix: true,
                                          })}`
                                        : "Not generated yet"}
                                    </p>
                                  </div>
                                  {canGenerateId && (
                                    <Button size="sm" variant="outline" onClick={() => openGenerateDialog(e)}>
                                      <IdCard className="mr-2 h-4 w-4" />
                                      Generate
                                    </Button>
                                  )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {e.idCardPdfUrl && (
                                    <Button size="sm" asChild>
                                      <a href={resolveFileUrl(e.idCardPdfUrl)} target="_blank" rel="noopener noreferrer">
                                        Download PDF
                                      </a>
                                    </Button>
                                  )}
                                  {e.idCardPngUrl && (
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={resolveFileUrl(e.idCardPngUrl)} target="_blank" rel="noopener noreferrer">
                                        Download PNG
                                      </a>
                                    </Button>
                                  )}
                                  {!e.idCardPdfUrl && (
                                    <p className="text-xs text-muted-foreground">No ID card available yet.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {canGenerateId && (
                          <Button variant="ghost" size="sm" onClick={() => openGenerateDialog(e)}>
                            <IdCard className="h-4 w-4" />
                          </Button>
                        )}
                        {canWrite && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setEditingEmployee(e)}>
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

          {total > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {showingFrom} to {showingTo} of {total.toLocaleString()} employees
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
            </div>
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No employees found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={templateSheetOpen} onOpenChange={setTemplateSheetOpen}>
        <SheetContent className="w-full space-y-6 overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Employee ID templates</SheetTitle>
            <SheetDescription>Customize how ID cards look across the organization.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={activeTemplateId ?? "__new__"}
              onValueChange={(value) => {
                if (value === "__new__") {
                  setActiveTemplateId(null);
                  setTemplateForm(buildTemplateForm());
                  return;
                }
                const found = idTemplates.find((tpl) => tpl.id === value);
                setActiveTemplateId(found?.id ?? null);
                setTemplateForm(buildTemplateForm(found ?? undefined));
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {idTemplates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
                {canManageId && <SelectItem value="__new__">Create new template</SelectItem>}
              </SelectContent>
            </Select>
            {canManageId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveTemplateId(null);
                  setTemplateForm(buildTemplateForm());
                }}
              >
                New template
              </Button>
            )}
            {activeTemplateId && canManageId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetDefaultTemplate(activeTemplateId)}
                disabled={templatesLoading}
              >
                Set default
              </Button>
            )}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-2xl border bg-card/60 p-4 shadow-sm">
              <div className="grid gap-2">
                <Label>Template name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => handleTemplateFieldChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={templateForm.description ?? ""}
                  onChange={(e) => handleTemplateFieldChange("description", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Card size</Label>
                  <Select
                    value={templateForm.settings.size}
                    onValueChange={(value) =>
                      handleTemplateSettingsChange("size", value as IdCardTemplateSettings["size"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID1">ID-1 (Standard)</SelectItem>
                      <SelectItem value="ID2">ID-2</SelectItem>
                      <SelectItem value="ID3">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select
                    value={templateForm.settings.layout}
                    onValueChange={(value) =>
                      handleTemplateSettingsChange("layout", value as IdCardTemplateSettings["layout"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHOTO_LEFT">Photo left</SelectItem>
                      <SelectItem value="PHOTO_RIGHT">Photo right</SelectItem>
                      <SelectItem value="PHOTO_TOP">Photo top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Background color</Label>
                  <Input
                    type="color"
                    value={templateForm.settings.background.value}
                    onChange={(e) =>
                      handleTemplateSettingsChange("background", {
                        ...templateForm.settings.background,
                        type: "color",
                        value: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Border radius</Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={templateForm.settings.border.radius}
                    onChange={(e) =>
                      handleTemplateSettingsChange("border", {
                        ...templateForm.settings.border,
                        radius: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Text color</Label>
                  <Input
                    type="color"
                    value={templateForm.settings.text.color}
                    onChange={(e) =>
                      handleTemplateSettingsChange("text", {
                        ...templateForm.settings.text,
                        color: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Font family</Label>
                  <Input
                    value={templateForm.settings.text.fontFamily}
                    onChange={(e) =>
                      handleTemplateSettingsChange("text", {
                        ...templateForm.settings.text,
                        fontFamily: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Body font size</Label>
                  <Input
                    type="number"
                    min={10}
                    max={32}
                    value={templateForm.settings.text.fontSize}
                    onChange={(e) =>
                      handleTemplateSettingsChange("text", {
                        ...templateForm.settings.text,
                        fontSize: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heading font size</Label>
                  <Input
                    type="number"
                    min={12}
                    max={48}
                    value={templateForm.settings.text.headingSize}
                    onChange={(e) =>
                      handleTemplateSettingsChange("text", {
                        ...templateForm.settings.text,
                        headingSize: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Code type</Label>
                <Select
                  value={templateForm.settings.codeType}
                  onValueChange={(value) =>
                    handleTemplateSettingsChange("codeType", value as IdCardTemplateSettings["codeType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QR">QR code</SelectItem>
                    <SelectItem value="BARCODE">Barcode</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload("logoUrl", file);
                    }}
                    disabled={uploadingAssets.logoUrl}
                  />
                  {templateForm.settings.assets?.logoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={resolveFileUrl(templateForm.settings.assets.logoUrl)}
                        alt="Logo preview"
                        className="h-10 w-auto rounded border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleTemplateSettingsChange("assets", {
                            ...templateForm.settings.assets,
                            logoUrl: undefined,
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {uploadingAssets.logoUrl && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Signature</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload("signatureUrl", file);
                    }}
                    disabled={uploadingAssets.signatureUrl}
                  />
                  {templateForm.settings.assets?.signatureUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={resolveFileUrl(templateForm.settings.assets.signatureUrl)}
                        alt="Signature preview"
                        className="h-10 w-auto rounded border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleTemplateSettingsChange("assets", {
                            ...templateForm.settings.assets,
                            signatureUrl: undefined,
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {uploadingAssets.signatureUrl && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Stamp</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload("stampUrl", file);
                    }}
                    disabled={uploadingAssets.stampUrl}
                  />
                  {templateForm.settings.assets?.stampUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={resolveFileUrl(templateForm.settings.assets.stampUrl)}
                        alt="Stamp preview"
                        className="h-10 w-auto rounded border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleTemplateSettingsChange("assets", {
                            ...templateForm.settings.assets,
                            stampUrl: undefined,
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {uploadingAssets.stampUrl && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload("backgroundUrl", file);
                    }}
                    disabled={uploadingAssets.backgroundUrl}
                  />
                  {templateForm.settings.assets?.backgroundUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={resolveFileUrl(templateForm.settings.assets.backgroundUrl)}
                        alt="Background preview"
                        className="h-20 w-auto rounded border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleTemplateSettingsChange("assets", {
                            ...templateForm.settings.assets,
                            backgroundUrl: undefined,
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {uploadingAssets.backgroundUrl && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Additional lines (one per line)</Label>
                <Textarea
                  rows={3}
                  value={templateForm.settings.extraLines.join("\n")}
                  onChange={(e) =>
                    handleTemplateSettingsChange(
                      "extraLines",
                      e.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Visible fields</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(templateForm.settings.fieldVisibility).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm capitalize">{field.replace(/show/i, "").replace(/([A-Z])/g, " $1")}</span>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => handleTemplateToggle(field as any, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Live preview</p>
              {previewEmployee ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Front</p>
                    <IdCardPreview
                      template={templateForm.settings}
                      employee={previewEmployee}
                      issueDate={idDialogIssueDate}
                      expiryDate={idDialogExpiryDate}
                      side="front"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Back</p>
                    <IdCardPreview
                      template={templateForm.settings}
                      employee={previewEmployee}
                      issueDate={idDialogIssueDate}
                      expiryDate={idDialogExpiryDate}
                      side="back"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Add an employee to preview this template.</p>
              )}
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setTemplateSheetOpen(false)}>
              Close
            </Button>
            {canManageId && (
              <Button onClick={handleTemplateSave} disabled={templateSaving || templatesLoading}>
                {templateSaving ? "Saving..." : templateForm.id ? "Update template" : "Create template"}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={idDialogOpen} onOpenChange={setIdDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate ID card</DialogTitle>
            <DialogDescription>
              {idDialogEmployee
                ? `Create an ID card for ${idDialogEmployee.firstName} ${idDialogEmployee.lastName}.`
                : "Select an employee to continue."}
            </DialogDescription>
          </DialogHeader>
          {idDialogEmployee ? (
            <div className="grid gap-6 lg:grid-cols-[0.65fr_0.35fr]">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Template</Label>
                  <Select value={idDialogTemplateId ?? ""} onValueChange={(value) => setIdDialogTemplateId(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {idTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name} {tpl.isDefault ? "(Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Issue date</Label>
                    <Input type="date" value={idDialogIssueDate} onChange={(e) => setIdDialogIssueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry date</Label>
                    <Input type="date" value={idDialogExpiryDate} onChange={(e) => setIdDialogExpiryDate(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleGenerateIdCard} disabled={idGenerating || !idDialogTemplateId}>
                  {idGenerating ? "Generating..." : "Generate ID"}
                </Button>
                {idResult && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium text-foreground">ID card ready</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild>
                        <a href={resolveFileUrl(idResult.pdfUrl)} target="_blank" rel="noopener noreferrer">
                          Download PDF
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={handlePrintIdCard}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={resolveFileUrl(idResult.pngUrl)} target="_blank" rel="noopener noreferrer">
                          Download PNG
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center bg-muted/40 p-3">
                {selectedTemplate ? (
                  <IdCardPreview
                    template={selectedTemplate.settings}
                    employee={idDialogEmployee}
                    issueDate={idDialogIssueDate}
                    expiryDate={idDialogExpiryDate}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No template available.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an employee to generate an ID card.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={batchDialogOpen}
        onOpenChange={(open) => {
          setBatchDialogOpen(open);
          if (!open) setBatchZipUrl(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Batch generate ID cards</DialogTitle>
            <DialogDescription>
              Generate cards for {selectedEmployeeIds.length} active employee
              {selectedEmployeeIds.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Template</Label>
              <Select value={batchTemplateId ?? ""} onValueChange={(value) => setBatchTemplateId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {idTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.isDefault ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Issue date</Label>
                <Input type="date" value={batchIssueDate} onChange={(e) => setBatchIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expiry date</Label>
                <Input type="date" value={batchExpiryDate} onChange={(e) => setBatchExpiryDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleBatchGenerate} disabled={batchGenerating || !batchTemplateId}>
              {batchGenerating ? "Generating..." : "Generate IDs"}
            </Button>
            {batchZipUrl && (
              <div className="rounded-lg border border-dashed p-3 text-sm">
                <p className="font-medium text-foreground">Batch ready</p>
                <Button asChild size="sm" className="mt-2">
                  <a href={resolveFileUrl(batchZipUrl)} target="_blank" rel="noopener noreferrer">
                    Download ZIP
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                        const deps = await apiListDepartments();
                        setDepartments(deps);
                        setEmployeeSummary((prev) => ({
                          ...prev,
                          departments: deps.length,
                        }));
                        setPage(1);
                        setReloadKey((key) => key + 1);
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
