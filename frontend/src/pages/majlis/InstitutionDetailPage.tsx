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
  Droplets,
  Zap,
  BookMarked,
  FlaskConical,
  Library,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import {
  institutionsApi,
  assignmentsApi,
  type Institution,
  type InstitutionRole,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEmployees, type Employee } from "@/services/employees";
import GoogleMapEmbed from "@/components/institutions/GoogleMapEmbed";

type StatusBadgeConfig = Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }>;

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const { data: institution, isLoading, error } = useQuery({
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MOSQUE":
        return <Building2 className="h-5 w-5" />;
      case "MADRASAH":
        return <School className="h-5 w-5" />;
      case "MARKAZ":
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: StatusBadgeConfig = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
      UNDER_CONSTRUCTION: { variant: "secondary", className: "bg-amber-100 text-amber-800 border-amber-200" },
      CLOSED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
      SUSPENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
      PENDING_APPROVAL: { variant: "secondary", className: "bg-amber-100 text-amber-800 border-amber-200" },
      ENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, className: "bg-gray-100 text-gray-800 border-gray-200" };
    return <Badge variant={config.variant} className={config.className}>{status.split("_").join(" ")}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{role.split("_").join(" ")}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-red-100 p-4 w-fit mx-auto mb-4">
            <Building2 className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Institution not found</h2>
          <p className="text-muted-foreground mb-6">
            The institution you're looking for may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => navigate("/majlis/institutions")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institutions
          </Button>
        </div>
      </div>
    );
  }

  const lat = institution.latitude != null ? Number(institution.latitude) : null;
  const lng = institution.longitude != null ? Number(institution.longitude) : null;
  const assignmentCount = assignments?.items?.length ?? 0;
  const activeCount = assignments?.items?.filter((a) => a.status === "ACTIVE").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Hero header */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/majlis/institutions")}
              className="text-white/90 hover:text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
                  {getTypeIcon(institution.type)}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{institution.name}</h1>
                  <p className="text-white/80 font-mono text-sm mt-0.5">{institution.institutionCode}</p>
                </div>
                {getStatusBadge(institution.status)}
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/majlis/institutions/${id}/edit`)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg border-0 self-start sm:self-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignmentCount}</p>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-3">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{institution.yearEstablished ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Year Established</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3">
              {getTypeIcon(institution.type)}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{institution.type}</p>
              <p className="text-sm text-muted-foreground">Type</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Basic Information</CardTitle>
            <CardDescription className="text-gray-600">Registry and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm">
                  {[
                    institution.kebeleName || institution.kebele?.name,
                    institution.woreda?.name,
                    institution.zone?.name,
                    institution.region?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Not specified"}
                </span>
              </div>
            </div>
            {institution.address && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Area / Address</Label>
                <p className="mt-1 text-sm">{institution.address}</p>
              </div>
            )}
            {lat != null && lng != null && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">GPS Coordinates</Label>
                <p className="mt-1 text-sm font-mono text-gray-700">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            )}
            {institution.ownershipStatus && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Ownership</Label>
                <p className="mt-1 text-sm">{institution.ownershipStatus.split("_").join(" ")}</p>
              </div>
            )}
            {institution.createdBy && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Created by</Label>
                <p className="mt-1 text-sm">
                  {institution.createdBy.firstName} {institution.createdBy.lastName}
                </p>
              </div>
            )}
            {institution.approvedBy && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Approved by</Label>
                <p className="mt-1 text-sm">
                  {institution.approvedBy.firstName} {institution.approvedBy.lastName}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type-Specific Details */}
        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Institution Details</CardTitle>
            <CardDescription className="text-gray-600">Type-specific information</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {institution.type === "MOSQUE" && institution.mosqueData && (
              <div className="space-y-4">
                {institution.mosqueData.capacity != null && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Capacity</Label>
                    <p className="mt-1 font-medium">{institution.mosqueData.capacity} worshippers</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Friday Jummah</span>
                    <Badge variant={institution.mosqueData.jummahAvailable ? "default" : "secondary"}>
                      {institution.mosqueData.jummahAvailable ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Women Prayer Space</span>
                    <Badge variant={institution.mosqueData.womenPrayerSpace ? "default" : "secondary"}>
                      {institution.mosqueData.womenPrayerSpace ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                {institution.mosqueData.utilities && (institution.mosqueData.utilities.water || institution.mosqueData.utilities.electricity) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Utilities</Label>
                    <div className="flex gap-4 flex-wrap">
                      {institution.mosqueData.utilities.water && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Droplets className="h-4 w-4 text-blue-600" /> Water
                        </span>
                      )}
                      {institution.mosqueData.utilities.electricity && (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Zap className="h-4 w-4 text-amber-500" /> Electricity
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {institution.type === "MADRASAH" && institution.madrasahData && (
              <div className="space-y-4">
                {institution.madrasahData.accreditationStatus && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Accreditation</Label>
                    <p className="mt-1 font-medium">{institution.madrasahData.accreditationStatus.split("_").join(" ")}</p>
                  </div>
                )}
                {institution.madrasahData.gradeLevels?.length ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Grade Levels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.madrasahData.gradeLevels.map((g) => {
                        return <Badge key={g} variant="outline">{g.split("_").join(" ")}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {((institution.madrasahData.students?.male != null) || (institution.madrasahData.students?.female != null)) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Students</Label>
                    <p className="mt-1 text-sm">
                      Male: {institution.madrasahData.students?.male !== undefined ? institution.madrasahData.students.male : 0}, Female: {institution.madrasahData.students?.female !== undefined ? institution.madrasahData.students.female : 0}
                    </p>
                  </div>
                )}
                {(institution.madrasahData.teachers?.islamic != null || institution.madrasahData.teachers?.science != null) && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Teachers</Label>
                    <p className="mt-1 text-sm">
                      Islamic: {institution.madrasahData.teachers?.islamic !== undefined ? institution.madrasahData.teachers.islamic : 0}, Science: {institution.madrasahData.teachers?.science !== undefined ? institution.madrasahData.teachers.science : 0}
                    </p>
                  </div>
                )}
                {institution.madrasahData.classrooms != null && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Classrooms</Label>
                    <p className="mt-1 font-medium">{institution.madrasahData.classrooms}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {institution.madrasahData.hasLabs && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <FlaskConical className="h-4 w-4 text-green-600" /> Labs
                    </span>
                  )}
                  {institution.madrasahData.hasLibrary && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Library className="h-4 w-4 text-blue-600" /> Library
                    </span>
                  )}
                </div>
              </div>
            )}
            {institution.type === "MARKAZ" && institution.markazData && (
              <div className="space-y-4">
                {institution.markazData.disciplines?.length ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Disciplines</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.markazData.disciplines.map((d) => {
                        return <Badge key={d} variant="outline">{d}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {(institution.markazData.studyLevels?.length ?? 0) >= 1 ? (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Study Levels</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {institution.markazData.studyLevels.map((l) => {
                        return <Badge key={l} variant="secondary">{l.split("_").join(" ")}</Badge>;
                      })}
                    </div>
                  </div>
                ) : null}
                {(institution.markazData.students != null || institution.markazData.scholars != null) && (
                  <div className="flex gap-6 flex-wrap">
                    {institution.markazData.students != null && (
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Students</Label>
                        <p className="mt-1 font-medium">{institution.markazData.students}</p>
                      </div>
                    )}
                    {institution.markazData.scholars != null && (
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Scholars</Label>
                        <p className="mt-1 font-medium">{institution.markazData.scholars}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {institution.markazData.daawahActivities && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <GraduationCap className="h-4 w-4 text-purple-600" /> Da'wah
                    </span>
                  )}
                  {institution.markazData.hasBoarding && (
                    <span className="inline-flex items-center gap-1.5 text-sm">Boarding</span>
                  )}
                  {institution.markazData.hasLibrary && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Library className="h-4 w-4 text-blue-600" /> Library
                    </span>
                  )}
                </div>
              </div>
            )}
            {!institution.mosqueData && !institution.madrasahData && !institution.markazData && (
              <p className="text-sm text-muted-foreground">No type-specific details recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Map */}
      {lat != null && lng != null && (
        <GoogleMapEmbed
          latitude={lat}
          longitude={lng}
          title={`${institution.name} — Location`}
          height={380}
          zoom={15}
        />
      )}

      {/* Assignments */}
      <Card className="shadow-md border-gray-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border-b py-4">
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
                <DialogDescription>Assign an employee to this institution</DialogDescription>
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
        <CardContent className="p-0">
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No assignments yet</p>
                    <p className="text-sm">Add an assignment to link employees to this institution.</p>
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
                    <TableCell>{new Date(assignment.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {assignment.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveAssignmentMutation.mutate({ id: assignment.id, approved: true })
                              }
                              className="hover:bg-green-50 hover:text-green-600"
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
                              className="hover:bg-red-50 hover:text-red-600"
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
                                  queryClient.invalidateQueries({ queryKey: ["institution-assignments", id] });
                                  toast.success("Assignment ended");
                                });
                              }
                            }}
                            className="hover:bg-orange-50 hover:text-orange-600"
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
                {role.split("_").join(" ")}
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
