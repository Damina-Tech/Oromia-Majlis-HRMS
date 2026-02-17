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
import { Checkbox } from "@/components/ui/checkbox";
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
  Navigation,
  Loader2,
} from "lucide-react";
import InstitutionMap from "@/components/institutions/InstitutionMap";
import {
  institutionsApi,
  regionsApi,
  type Institution,
  type InstitutionType,
  type InstitutionStatus,
  type OwnershipStatus,
  type Region,
  type Zone,
  type Woreda,
  type Kebele,
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
              <CreateInstitutionForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateDialogOpen(false)}
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
    status: "ACTIVE" as InstitutionStatus,
    address: "",
    latitude: "",
    longitude: "",
    yearEstablished: new Date().getFullYear(),
    ownershipStatus: "MAJLIS_OWNED" as OwnershipStatus,
    regionId: "",
    zoneId: "",
    woredaId: "",
    kebeleName: "",
    // Type-specific data
    mosqueData: {
      capacity: undefined as number | undefined,
      jummahAvailable: false,
      womenPrayerSpace: false,
      utilities: {
        water: false,
        electricity: false,
      },
    },
    madrasahData: {
      curriculumType: "INTEGRATED" as const,
      gradeLevels: [] as ("PRIMARY" | "SECONDARY" | "PREPARATORY")[],
      accreditationStatus: "NOT_ACCREDITED" as "ACCREDITED" | "PROVISIONALLY_ACCREDITED" | "NOT_ACCREDITED",
      students: {
        male: undefined as number | undefined,
        female: undefined as number | undefined,
      },
      teachers: {
        islamic: undefined as number | undefined,
        science: undefined as number | undefined,
      },
      classrooms: undefined as number | undefined,
      hasLabs: false,
      hasLibrary: false,
    },
    markazData: {
      disciplines: [] as ("QURAN" | "HADITH" | "TAFSIR" | "FIQH" | "AQEEDAH" | "TARBIYA" | "ARABIC")[],
      studyLevels: [] as ("BEGINNER" | "INTERMEDIATE" | "ADVANCED")[],
      daawahActivities: false,
      students: undefined as number | undefined,
      scholars: undefined as number | undefined,
      hasBoarding: false,
      hasLibrary: false,
    },
  });

  // Fetch regions with nested zones, woredas, and kebeles
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsApi.list(),
  });

  // Get selected region, zone (for cascading dropdowns)
  const selectedRegion = regions?.find((r) => r.id === formData.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === formData.zoneId);

  // GPS location state
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get current GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        });
        setIsGettingLocation(false);
        toast.success("Location captured successfully");
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      address: formData.address || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      yearEstablished: formData.yearEstablished,
      ownershipStatus: formData.ownershipStatus,
      regionId: formData.regionId || undefined,
      zoneId: formData.zoneId || undefined,
      woredaId: formData.woredaId || undefined,
      kebeleName: formData.kebeleName || undefined,
    };

    if (formData.type === "MOSQUE") {
      submitData.mosqueData = {
        ...formData.mosqueData,
        capacity: formData.mosqueData.capacity || undefined,
        utilities: {
          water: formData.mosqueData.utilities.water || undefined,
          electricity: formData.mosqueData.utilities.electricity || undefined,
        },
      };
    } else if (formData.type === "MADRASAH") {
      submitData.madrasahData = {
        ...formData.madrasahData,
        gradeLevels: formData.madrasahData.gradeLevels,
        students: {
          male: formData.madrasahData.students.male || undefined,
          female: formData.madrasahData.students.female || undefined,
        },
        teachers: {
          islamic: formData.madrasahData.teachers.islamic || undefined,
          science: formData.madrasahData.teachers.science || undefined,
        },
        classrooms: formData.madrasahData.classrooms || undefined,
      };
    } else if (formData.type === "MARKAZ") {
      submitData.markazData = {
        ...formData.markazData,
        disciplines: formData.markazData.disciplines,
        studyLevels: formData.markazData.studyLevels,
        students: formData.markazData.students || undefined,
        scholars: formData.markazData.scholars || undefined,
      };
    }

    onSubmit(submitData);
  };

  // Reset cascading dropdowns when parent changes
  const handleRegionChange = (regionId: string) => {
    setFormData({
      ...formData,
      regionId,
      zoneId: "",
      woredaId: "",
    });
  };

  const handleZoneChange = (zoneId: string) => {
    setFormData({
      ...formData,
      zoneId,
      woredaId: "",
    });
  };

  const handleWoredaChange = (woredaId: string) => {
    setFormData({
      ...formData,
      woredaId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label>Institution Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div>
          <Label>Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v as InstitutionStatus })}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="UNDER_CONSTRUCTION">Under Construction</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => {
              const newType = v as InstitutionType;
              // Reset type-specific data when type changes
              setFormData({
                ...formData,
                type: newType,
                mosqueData:
                  newType === "MOSQUE"
                    ? {
                        capacity: undefined,
                        jummahAvailable: false,
                        womenPrayerSpace: false,
                        utilities: { water: false, electricity: false },
                      }
                    : formData.mosqueData,
                madrasahData:
                  newType === "MADRASAH"
                    ? {
                        curriculumType: "INTEGRATED",
                        gradeLevels: [],
                        accreditationStatus: "NOT_ACCREDITED",
                        students: { male: undefined, female: undefined },
                        teachers: { islamic: undefined, science: undefined },
                        classrooms: undefined,
                        hasLabs: false,
                        hasLibrary: false,
                      }
                    : formData.madrasahData,
                markazData:
                  newType === "MARKAZ"
                    ? {
                        disciplines: [],
                        studyLevels: [],
                        daawahActivities: false,
                        students: undefined,
                        scholars: undefined,
                        hasBoarding: false,
                        hasLibrary: false,
                      }
                    : formData.markazData,
              });
            }}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MOSQUE">Mosque</SelectItem>
              <SelectItem value="MADRASAH">Madrasah</SelectItem>
              <SelectItem value="MARKAZ">Markaz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Year Established</Label>
            <Input
              type="number"
              value={formData.yearEstablished}
              onChange={(e) =>
                setFormData({ ...formData, yearEstablished: parseInt(e.target.value) })
              }
              className="border-gray-300 focus:border-blue-500"
            />
          </div>
          <div>
            <Label>Ownership Status</Label>
            <Select
              value={formData.ownershipStatus}
              onValueChange={(v) =>
                setFormData({ ...formData, ownershipStatus: v as OwnershipStatus })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAJLIS_OWNED">Majlis Owned</SelectItem>
                <SelectItem value="COMMUNITY_OWNED">Community Owned</SelectItem>
                <SelectItem value="WAQF">Waqf</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Geographic Location */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Geographic Location</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use GPS Location
                </>
              )}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Region</Label>
              <Select value={formData.regionId} onValueChange={handleRegionChange}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone</Label>
              <Select
                value={formData.zoneId}
                onValueChange={handleZoneChange}
                disabled={!formData.regionId}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRegion?.zones?.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Woreda</Label>
              <Select
                value={formData.woredaId}
                onValueChange={handleWoredaChange}
                disabled={!formData.zoneId}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Woreda" />
                </SelectTrigger>
                <SelectContent>
                  {selectedZone?.woredas?.map((woreda) => (
                    <SelectItem key={woreda.id} value={woreda.id}>
                      {woreda.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kebele (Optional – enter manually)</Label>
              <Input
                value={formData.kebeleName}
                onChange={(e) => setFormData({ ...formData, kebeleName: e.target.value })}
                placeholder="e.g. Kebele 01, Bole, etc."
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <Label>Area (Optional)</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="border-gray-300 focus:border-blue-500"
              rows={2}
              placeholder="Enter specific area or neighborhood details"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Latitude (GPS Coordinates)
              </Label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="9.1450"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Longitude (GPS Coordinates)
              </Label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="38.7617"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mosque-specific fields */}
      {formData.type === "MOSQUE" && (
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold text-gray-800">Mosque Details</h3>
          <div>
            <Label>Capacity (worshippers)</Label>
            <Input
              type="number"
              value={formData.mosqueData.capacity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mosqueData: {
                    ...formData.mosqueData,
                    capacity: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.mosqueData.jummahAvailable}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    mosqueData: { ...formData.mosqueData, jummahAvailable: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Friday Jummah Available</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.mosqueData.womenPrayerSpace}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    mosqueData: { ...formData.mosqueData, womenPrayerSpace: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Women Prayer Space</Label>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Utilities</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.mosqueData.utilities.water}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mosqueData: {
                        ...formData.mosqueData,
                        utilities: {
                          ...formData.mosqueData.utilities,
                          water: checked === true,
                        },
                      },
                    })
                  }
                />
                <Label className="cursor-pointer">Water</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.mosqueData.utilities.electricity}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      mosqueData: {
                        ...formData.mosqueData,
                        utilities: {
                          ...formData.mosqueData.utilities,
                          electricity: checked === true,
                        },
                      },
                    })
                  }
                />
                <Label className="cursor-pointer">Electricity</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Madrasah-specific fields */}
      {formData.type === "MADRASAH" && (
        <div className="space-y-4 p-4 border rounded-lg bg-green-50">
          <h3 className="font-semibold text-gray-800">Madrasah Details</h3>
          <div>
            <Label>Accreditation Status *</Label>
            <Select
              value={formData.madrasahData.accreditationStatus}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  madrasahData: {
                    ...formData.madrasahData,
                    accreditationStatus: v as any,
                  },
                })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCREDITED">Accredited</SelectItem>
                <SelectItem value="PROVISIONALLY_ACCREDITED">Provisionally Accredited</SelectItem>
                <SelectItem value="NOT_ACCREDITED">Not Accredited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grade Levels * (Select at least one)</Label>
            <div className="border rounded-lg p-3 bg-white">
              {(["PRIMARY", "SECONDARY", "PREPARATORY"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2 py-2">
                  <Checkbox
                    checked={formData.madrasahData.gradeLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      const current = formData.madrasahData.gradeLevels;
                      setFormData({
                        ...formData,
                        madrasahData: {
                          ...formData.madrasahData,
                          gradeLevels: checked
                            ? [...current, level]
                            : current.filter((l) => l !== level),
                        },
                      });
                    }}
                  />
                  <Label className="cursor-pointer capitalize">{level.toLowerCase()}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Number of Students (Male)</Label>
              <Input
                type="number"
                value={formData.madrasahData.students.male || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    madrasahData: {
                      ...formData.madrasahData,
                      students: {
                        ...formData.madrasahData.students,
                        male: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Number of Students (Female)</Label>
              <Input
                type="number"
                value={formData.madrasahData.students.female || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    madrasahData: {
                      ...formData.madrasahData,
                      students: {
                        ...formData.madrasahData.students,
                        female: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Number of Teachers (Islamic)</Label>
              <Input
                type="number"
                value={formData.madrasahData.teachers.islamic || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    madrasahData: {
                      ...formData.madrasahData,
                      teachers: {
                        ...formData.madrasahData.teachers,
                        islamic: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Number of Teachers (Science)</Label>
              <Input
                type="number"
                value={formData.madrasahData.teachers.science || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    madrasahData: {
                      ...formData.madrasahData,
                      teachers: {
                        ...formData.madrasahData.teachers,
                        science: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Number of Classrooms</Label>
              <Input
                type="number"
                value={formData.madrasahData.classrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    madrasahData: {
                      ...formData.madrasahData,
                      classrooms: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.madrasahData.hasLabs}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    madrasahData: { ...formData.madrasahData, hasLabs: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Has Labs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.madrasahData.hasLibrary}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    madrasahData: { ...formData.madrasahData, hasLibrary: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Has Library</Label>
            </div>
          </div>
        </div>
      )}

      {/* Markaz-specific fields */}
      {formData.type === "MARKAZ" && (
        <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
          <h3 className="font-semibold text-gray-800">Markaz Details</h3>
          <div>
            <Label>Islamic Disciplines * (Select at least one)</Label>
            <div className="border rounded-lg p-3 bg-white">
              {(["QURAN", "HADITH", "TAFSIR", "FIQH", "AQEEDAH", "TARBIYA", "ARABIC"] as const).map(
                (discipline) => (
                  <div key={discipline} className="flex items-center gap-2 py-2">
                    <Checkbox
                      checked={formData.markazData.disciplines.includes(discipline)}
                      onCheckedChange={(checked) => {
                        const current = formData.markazData.disciplines;
                        setFormData({
                          ...formData,
                          markazData: {
                            ...formData.markazData,
                            disciplines: checked
                              ? [...current, discipline]
                              : current.filter((d) => d !== discipline),
                          },
                        });
                      }}
                    />
                    <Label className="cursor-pointer capitalize">{discipline.toLowerCase()}</Label>
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <Label>Study Levels * (Select at least one)</Label>
            <div className="border rounded-lg p-3 bg-white">
              {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2 py-2">
                  <Checkbox
                    checked={formData.markazData.studyLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      const current = formData.markazData.studyLevels;
                      setFormData({
                        ...formData,
                        markazData: {
                          ...formData.markazData,
                          studyLevels: checked
                            ? [...current, level]
                            : current.filter((l) => l !== level),
                        },
                      });
                    }}
                  />
                  <Label className="cursor-pointer capitalize">{level.toLowerCase()}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Number of Students</Label>
              <Input
                type="number"
                value={formData.markazData.students || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    markazData: {
                      ...formData.markazData,
                      students: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Number of Scholars</Label>
              <Input
                type="number"
                value={formData.markazData.scholars || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    markazData: {
                      ...formData.markazData,
                      scholars: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.markazData.daawahActivities}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    markazData: { ...formData.markazData, daawahActivities: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Da'wah Activities</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.markazData.hasBoarding}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    markazData: { ...formData.markazData, hasBoarding: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Has Boarding</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.markazData.hasLibrary}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    markazData: { ...formData.markazData, hasLibrary: checked === true },
                  })
                }
              />
              <Label className="cursor-pointer">Has Library</Label>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          Create Institution
        </Button>
      </div>
    </form>
  );
}

