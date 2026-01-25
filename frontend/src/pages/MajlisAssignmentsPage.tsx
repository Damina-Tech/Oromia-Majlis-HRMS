"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
} from "lucide-react";
import {
  assignmentsApi,
  type InstitutionAssignment,
  type AssignmentStatus,
  type InstitutionRole,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MajlisAssignmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<InstitutionRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assignments", page, statusFilter, roleFilter, search],
    queryFn: () =>
      assignmentsApi.list({
        page,
        limit: 20,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) =>
      assignmentsApi.approve(id, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update assignment");
    },
  });

  const endMutation = useMutation({
    mutationFn: assignmentsApi.end,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment ended successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to end assignment");
    },
  });

  const getStatusBadge = (status: AssignmentStatus) => {
    const variants: Record<AssignmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      ENDED: "outline",
      SUSPENDED: "destructive",
      PENDING_APPROVAL: "secondary",
    };
    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>;
  };

  const getRoleBadge = (role: InstitutionRole) => {
    return <Badge variant="outline">{role.replace("_", " ")}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading assignments</div>;
  }

  const pendingAssignments = data?.items.filter((a) => a.status === "PENDING_APPROVAL") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Assignments</h1>
          <p className="text-muted-foreground">Manage institution personnel assignments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ENDED">Ended</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="IMAM">Imam</SelectItem>
                <SelectItem value="MUAZZIN">Muazzin</SelectItem>
                <SelectItem value="MOSQUE_COMMITTEE_MEMBER">Mosque Committee</SelectItem>
                <SelectItem value="MADRASAH_DIRECTOR">Madrasah Director</SelectItem>
                <SelectItem value="MADRASAH_BOARD_MEMBER">Madrasah Board</SelectItem>
                <SelectItem value="MARKAZ_DIRECTOR">Markaz Director</SelectItem>
                <SelectItem value="MARKAZ_COMMITTEE_MEMBER">Markaz Committee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Alert */}
      {pendingAssignments.length > 0 && statusFilter === "ALL" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingAssignments.length})
            </CardTitle>
            <CardDescription>
              {pendingAssignments.length} assignment(s) require your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setStatusFilter("PENDING_APPROVAL")}
            >
              View Pending
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((assignment) => (
                  <TableRow key={assignment.id}>
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
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.institution?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.institution?.institutionCode}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/majlis/institutions/${assignment.institutionId}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {assignment.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: assignment.id,
                                  approved: true,
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                if (reason) {
                                  approveMutation.mutate({
                                    id: assignment.id,
                                    approved: false,
                                    rejectionReason: reason,
                                  });
                                }
                              }}
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
                                endMutation.mutate(assignment.id);
                              }
                            }}
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

          {/* Pagination */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= data.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

