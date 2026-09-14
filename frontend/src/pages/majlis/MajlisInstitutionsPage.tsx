"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Building2,
  School,
  BookOpen,
  Eye,
  Edit,
  Map,
  MapPin,
  Link2,
} from "lucide-react";
import InstitutionMap from "@/components/institutions/InstitutionMap";
import InstitutionRegistrationForm from "@/components/institutions/InstitutionRegistrationForm";
import {
  institutionsApi,
  type Institution,
  type InstitutionType,
  type InstitutionStatus,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const PUBLIC_INSTITUTION_REGISTER_PATH = "/register/institution";

function publicInstitutionRegisterUrl() {
  if (typeof window === "undefined") return PUBLIC_INSTITUTION_REGISTER_PATH;
  return `${window.location.origin}${PUBLIC_INSTITUTION_REGISTER_PATH}`;
}

export default function MajlisInstitutionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InstitutionType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<InstitutionStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["institutions", page, typeFilter, statusFilter, search],
    queryFn: () =>
      institutionsApi.list({
        page,
        limit: 20,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: institutionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      setIsCreateDialogOpen(false);
      toast.success("Institution created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create institution");
    },
  });

  const getTypeIcon = (type: InstitutionType) => {
    switch (type) {
      case "MOSQUE":
        return <Building2 className="h-4 w-4" />;
      case "MADRASAH":
        return <School className="h-4 w-4" />;
      case "MARKAZ":
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: InstitutionStatus) => {
    const statusConfig: Record<InstitutionStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      ACTIVE: { variant: "default", className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" },
      UNDER_CONSTRUCTION: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" },
      CLOSED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" },
      SUSPENDED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200" },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant} className={config.className}>{status.replace("_", " ")}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading institutions</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Majlis Institutions</h1>
          <p className="text-muted-foreground">Manage mosques, madrasahs, and markaz</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const url = publicInstitutionRegisterUrl();
              try {
                await navigator.clipboard.writeText(url);
                toast.success("Public registration link copied");
              } catch {
                toast.error(`Copy this link: ${url}`);
              }
            }}
            className="border-indigo-300 text-indigo-800 hover:bg-indigo-50"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy public link
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowMap(!showMap)}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <Map className="h-4 w-4 mr-2" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                New Institution
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Institution</DialogTitle>
                <DialogDescription>
                  Register a new mosque, madrasah, or markaz
                </DialogDescription>
              </DialogHeader>
              <InstitutionRegistrationForm
                variant="admin"
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateDialogOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search institutions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="MOSQUE">Mosque</SelectItem>
                <SelectItem value="MADRASAH">Madrasah</SelectItem>
                <SelectItem value="MARKAZ">Markaz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="UNDER_CONSTRUCTION">Under Construction</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map Visualization */}
      {showMap && data && (
        <InstitutionMap
          institutions={data.items}
          onInstitutionClick={(inst) => navigate(`/majlis/institutions/${inst.id}`)}
        />
      )}

      {/* Institutions Table */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg font-semibold text-gray-800">Institutions ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Code</TableHead>
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Location</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((institution) => (
                <TableRow key={institution.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <TableCell className="font-mono text-sm">
                    {institution.institutionCode}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{institution.name}</span>
                      {institution.submitter?.source === "PUBLIC" ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200">
                          Public
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(institution.type)}
                      <span>{institution.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {institution.woreda?.name || institution.zone?.name || institution.region?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(institution.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/majlis/institutions/${institution.id}`)}
                        className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/majlis/institutions/${institution.id}/edit`)}
                        className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                        title="Edit Institution"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
