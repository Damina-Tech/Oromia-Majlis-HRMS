"use client";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  School,
  BookOpen,
  MapPin,
  Calendar,
  Users,
  Edit,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  institutionsApi,
  assignmentsApi,
  type Institution,
  type InstitutionAssignment,
  type InstitutionRole,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEmployees, type Employee } from "@/services/employees";
import InstitutionMap from "@/components/institutions/InstitutionMap";

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution", id],
    queryFn: () => institutionsApi.get(id!),
    enabled: !!id,
  });

  const { data: assignments } = useQuery({
    queryKey: ["institution-assignments", id],
    queryFn: () => assignmentsApi.list({ institutionId: id }),
    enabled: !!id,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees({ page: 1, pageSize: 1000 }),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: assignmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
      setIsAssignmentDialogOpen(false);
      toast.success("Assignment created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create assignment");
    },
  });

  const approveAssignmentMutation = useMutation({
    mutationFn: ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) =>
      assignmentsApi.approve(id, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
      toast.success("Assignment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update assignment");
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading institution details...</div>;
  }

  if (!institution) {
    return <div className="p-6">Institution not found</div>;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MOSQUE":
        return <Building2 className="h-5 w-5" />;
      case "MADRASAH":
        return <School className="h-5 w-5" />;
      case "MARKAZ":
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
      UNDER_CONSTRUCTION: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      CLOSED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
      SUSPENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
      PENDING_APPROVAL: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      ENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, className: "bg-gray-100 text-gray-800 border-gray-200" };
    return <Badge variant={config.variant} className={config.className}>{status.replace("_", " ")}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{role.replace("_", " ")}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/institutions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getTypeIcon(institution.type)}
            <h1 className="text-3xl font-bold">{institution.name}</h1>
          </div>
          <p className="text-muted-foreground">{institution.institutionCode}</p>
        </div>
        <Button 
          onClick={() => navigate(`/majlis/institutions/${id}/edit`)}
          className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(institution.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <div className="mt-1 flex items-center gap-2">
                {getTypeIcon(institution.type)}
                <span>{institution.type}</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <div className="mt-1 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {[
                    institution.kebele?.name,
                    institution.woreda?.name,
                    institution.zone?.name,
                    institution.region?.name,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            </div>
            {institution.address && (
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="mt-1">{institution.address}</p>
              </div>
            )}
            {institution.yearEstablished && (
              <div>
                <Label className="text-muted-foreground">Year Established</Label>
                <p className="mt-1">{institution.yearEstablished}</p>
              </div>
            )}
            {institution.ownershipStatus && (
              <div>
                <Label className="text-muted-foreground">Ownership</Label>
                <p className="mt-1">{institution.ownershipStatus.replace("_", " ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type-Specific Details */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Institution Details</CardTitle>
          </CardHeader>
          <CardContent>
            {institution.type === "MOSQUE" && institution.mosqueData && (
              <div className="space-y-2">
                {institution.mosqueData.capacity && (
                  <div>
                    <Label className="text-muted-foreground">Capacity</Label>
                    <p>{institution.mosqueData.capacity} worshippers</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div>
                    <Label className="text-muted-foreground">Friday Jummah</Label>
                    <p>{institution.mosqueData.jummahAvailable ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Women Prayer Space</Label>
                    <p>{institution.mosqueData.womenPrayerSpace ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            )}
            {institution.type === "MADRASAH" && institution.madrasahData && (
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Accreditation</Label>
                  <p>{institution.madrasahData.accreditationStatus?.replace("_", " ")}</p>
                </div>
                {institution.madrasahData.students && (
                  <div>
                    <Label className="text-muted-foreground">Students</Label>
                    <p>
                      Male: {institution.madrasahData.students.male || 0}, Female:{" "}
                      {institution.madrasahData.students.female || 0}
                    </p>
                  </div>
                )}
                {institution.madrasahData.teachers && (
                  <div>
                    <Label className="text-muted-foreground">Teachers</Label>
                    <p>
                      Islamic: {institution.madrasahData.teachers.islamic || 0}, Science:{" "}
                      {institution.madrasahData.teachers.science || 0}
                    </p>
                  </div>
                )}
              </div>
            )}
            {institution.type === "MARKAZ" && institution.markazData && (
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Disciplines</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {institution.markazData.disciplines?.map((d) => (
                      <Badge key={d} variant="outline">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                {institution.markazData.students && (
                  <div>
                    <Label className="text-muted-foreground">Students</Label>
                    <p>{institution.markazData.students}</p>
                  </div>
                )}
                {institution.markazData.scholars && (
                  <div>
                    <Label className="text-muted-foreground">Scholars</Label>
                    <p>{institution.markazData.scholars}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {institution.latitude && institution.longitude && (
        <InstitutionMap
          institutions={[institution]}
          center={{
            lat: Number(institution.latitude),
            lng: Number(institution.longitude),
          }}
        />
      )}

      {/* Assignments */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">HR Assignments</CardTitle>
            <CardDescription className="text-gray-600">Personnel assigned to this institution</CardDescription>
          </div>
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
                <DialogDescription>
                  Assign an employee to this institution
                </DialogDescription>
              </DialogHeader>
              <CreateAssignmentForm
                institution={institution}
                employees={employees?.items || []}
                onSubmit={(data) => createAssignmentMutation.mutate(data)}
                onCancel={() => setIsAssignmentDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Start Date</TableHead>
                <TableHead className="font-semibold text-gray-700">End Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No assignments yet
                  </TableCell>
                </TableRow>
              ) : (
                assignments?.items.map((assignment) => (
                  <TableRow key={assignment.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.employee?.firstName} {assignment.employee?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.employee?.employeeCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {assignment.endDate
                        ? new Date(assignment.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {assignment.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveAssignmentMutation.mutate({
                                  id: assignment.id,
                                  approved: true,
                                })
                              }
                              className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveAssignmentMutation.mutate({
                                  id: assignment.id,
                                  approved: false,
                                  rejectionReason: "Rejected by user",
                                })
                              }
                              className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {assignment.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("End this assignment?")) {
                                assignmentsApi.end(assignment.id).then(() => {
                                  queryClient.invalidateQueries({
                                    queryKey: ["institution-assignments", id],
                                  });
                                  toast.success("Assignment ended");
                                });
                              }
                            }}
                            className="hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200"
                            title="End Assignment"
                          >
                            End
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateAssignmentForm({
  institution,
  employees,
  onSubmit,
  onCancel,
}: {
  institution: Institution;
  employees: Employee[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    employeeId: "",
    role: "IMAM" as InstitutionRole,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const getAvailableRoles = (type: string): InstitutionRole[] => {
    switch (type) {
      case "MOSQUE":
        return ["IMAM", "MUAZZIN", "MOSQUE_COMMITTEE_MEMBER"];
      case "MADRASAH":
        return ["MADRASAH_DIRECTOR", "MADRASAH_BOARD_MEMBER"];
      case "MARKAZ":
        return ["MARKAZ_DIRECTOR", "MARKAZ_COMMITTEE_MEMBER"];
      default:
        return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employeeId: formData.employeeId,
      institutionId: institution.id,
      role: formData.role,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employee *</Label>
        <Select
          value={formData.employeeId}
          onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
          required
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

      <div>
        <Label>Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(v) => setFormData({ ...formData, role: v as InstitutionRole })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRoles(institution.type).map((role) => (
              <SelectItem key={role} value={role}>
                {role.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Start Date *</Label>
        <Input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>End Date (Optional)</Label>
        <Input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Assignment</Button>
      </div>
    </form>
  );
}

