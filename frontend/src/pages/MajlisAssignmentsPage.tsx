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
    const statusConfig: Record<AssignmentStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" },
      ENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200" },
      SUSPENDED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" },
      PENDING_APPROVAL: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant} className={config.className}>{status.replace("_", " ")}</Badge>;
  };

  const getRoleBadge = (role: InstitutionRole) => {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{role.replace("_", " ")}</Badge>;
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
        <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Pending Approvals ({pendingAssignments.length})
            </CardTitle>
            <CardDescription className="text-yellow-700">
              {pendingAssignments.length} assignment(s) require your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setStatusFilter("PENDING_APPROVAL")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              View Pending
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assignments Table */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-800">Assignments ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                <TableHead className="font-semibold text-gray-700">Institution</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Start Date</TableHead>
                <TableHead className="font-semibold text-gray-700">End Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((assignment) => (
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
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                          title="View Institution"
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
                              className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                              title="Approve"
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
                                endMutation.mutate(assignment.id);
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

