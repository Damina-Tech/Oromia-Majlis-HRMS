"use client";
import React, { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MapPin,
  Building2,
  School,
  BookOpen,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Filter,
  Map,
} from "lucide-react";
import InstitutionMap from "@/components/institutions/InstitutionMap";
import {
  institutionsApi,
  type Institution,
  type InstitutionType,
  type InstitutionStatus,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    const variants: Record<InstitutionStatus, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      UNDER_CONSTRUCTION: "secondary",
      CLOSED: "destructive",
      SUSPENDED: "outline",
    };
    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>;
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
          <Button variant="outline" onClick={() => setShowMap(!showMap)}>
            <Map className="h-4 w-4 mr-2" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Institution
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Institution</DialogTitle>
                <DialogDescription>
                  Register a new mosque, madrasah, or markaz
                </DialogDescription>
              </DialogHeader>
              <CreateInstitutionForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
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
                  placeholder="Search institutions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
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
      <Card>
        <CardHeader>
          <CardTitle>Institutions ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-mono text-sm">
                    {institution.institutionCode}
                  </TableCell>
                  <TableCell className="font-medium">{institution.name}</TableCell>
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/majlis/institutions/${institution.id}/edit`)}
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

function CreateInstitutionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "MOSQUE" as InstitutionType,
    address: "",
    yearEstablished: new Date().getFullYear(),
    ownershipStatus: "MAJLIS_OWNED" as const,
    // Type-specific data
    mosqueData: {} as any,
    madrasahData: {} as any,
    markazData: {} as any,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      type: formData.type,
      address: formData.address,
      yearEstablished: formData.yearEstablished,
      ownershipStatus: formData.ownershipStatus,
    };

    if (formData.type === "MOSQUE") {
      submitData.mosqueData = formData.mosqueData;
    } else if (formData.type === "MADRASAH") {
      submitData.madrasahData = formData.madrasahData;
    } else if (formData.type === "MARKAZ") {
      submitData.markazData = formData.markazData;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Institution Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v as InstitutionType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MOSQUE">Mosque</SelectItem>
            <SelectItem value="MADRASAH">Madrasah</SelectItem>
            <SelectItem value="MARKAZ">Markaz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Address</Label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <Label>Year Established</Label>
        <Input
          type="number"
          value={formData.yearEstablished}
          onChange={(e) =>
            setFormData({ ...formData, yearEstablished: parseInt(e.target.value) })
          }
        />
      </div>

      {/* Type-specific fields */}
      {formData.type === "MOSQUE" && (
        <div className="space-y-4 p-4 border rounded">
          <h3 className="font-semibold">Mosque Details</h3>
          <div>
            <Label>Capacity (worshippers)</Label>
            <Input
              type="number"
              value={formData.mosqueData.capacity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mosqueData: { ...formData.mosqueData, capacity: parseInt(e.target.value) },
                })
              }
            />
          </div>
        </div>
      )}

      {formData.type === "MADRASAH" && (
        <div className="space-y-4 p-4 border rounded">
          <h3 className="font-semibold">Madrasah Details</h3>
          <div>
            <Label>Number of Students (Male)</Label>
            <Input
              type="number"
              value={formData.madrasahData.students?.male || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  madrasahData: {
                    ...formData.madrasahData,
                    students: {
                      ...formData.madrasahData.students,
                      male: parseInt(e.target.value),
                    },
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {formData.type === "MARKAZ" && (
        <div className="space-y-4 p-4 border rounded">
          <h3 className="font-semibold">Markaz Details</h3>
          <div>
            <Label>Number of Students</Label>
            <Input
              type="number"
              value={formData.markazData.students || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  markazData: { ...formData.markazData, students: parseInt(e.target.value) },
                })
              }
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Institution</Button>
      </div>
    </form>
  );
}

