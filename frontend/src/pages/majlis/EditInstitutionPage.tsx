"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Save, MapPin, Navigation, Loader2 } from "lucide-react";
import {
  institutionsApi,
  regionsApi,
  type Institution,
  type InstitutionType,
  type InstitutionStatus,
  type OwnershipStatus,
} from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function EditInstitutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution", id],
    queryFn: () => institutionsApi.get(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => institutionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution", id] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("Institution updated successfully");
      navigate(`/majlis/institutions/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update institution");
    },
  });

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
    mosqueData: {
      capacity: undefined as number | undefined,
      jummahAvailable: false,
      womenPrayerSpace: false,
      utilities: { water: false, electricity: false },
    },
    madrasahData: {
      curriculumType: "INTEGRATED" as const,
      gradeLevels: [] as ("PRIMARY" | "SECONDARY" | "PREPARATORY")[],
      accreditationStatus: "NOT_ACCREDITED" as "ACCREDITED" | "PROVISIONALLY_ACCREDITED" | "NOT_ACCREDITED",
      students: { male: undefined as number | undefined, female: undefined as number | undefined },
      teachers: { islamic: undefined as number | undefined, science: undefined as number | undefined },
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

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsApi.list(),
  });
  const selectedRegion = regions?.find((r) => r.id === formData.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === formData.zoneId);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setIsGettingLocation(false);
        toast.success("Location captured successfully");
      },
      (error) => {
        setIsGettingLocation(false);
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]: "Location access denied. Please enable location permissions.",
          [error.POSITION_UNAVAILABLE]: "Location information unavailable.",
          [error.TIMEOUT]: "Location request timed out.",
        };
        toast.error(messages[error.code] ?? "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!institution) return;
    const m = institution.mosqueData;
    const mad = institution.madrasahData;
    const mar = institution.markazData;
    setFormData({
      name: institution.name || "",
      type: institution.type,
      status: institution.status,
      address: institution.address || "",
      latitude: institution.latitude != null ? String(institution.latitude) : "",
      longitude: institution.longitude != null ? String(institution.longitude) : "",
      yearEstablished: institution.yearEstablished ?? new Date().getFullYear(),
      ownershipStatus: institution.ownershipStatus || "MAJLIS_OWNED",
      regionId: institution.regionId || institution.region?.id || "",
      zoneId: institution.zoneId || institution.zone?.id || "",
      woredaId: institution.woredaId || institution.woreda?.id || "",
      kebeleName: institution.kebeleName || institution.kebele?.name || "",
      mosqueData: {
        capacity: m?.capacity,
        jummahAvailable: m?.jummahAvailable ?? false,
        womenPrayerSpace: m?.womenPrayerSpace ?? false,
        utilities: {
          water: m?.utilities?.water ?? false,
          electricity: m?.utilities?.electricity ?? false,
        },
      },
      madrasahData: {
        curriculumType: mad?.curriculumType ?? "INTEGRATED",
        gradeLevels: mad?.gradeLevels ?? [],
        accreditationStatus: mad?.accreditationStatus ?? "NOT_ACCREDITED",
        students: {
          male: mad?.students?.male,
          female: mad?.students?.female,
        },
        teachers: {
          islamic: mad?.teachers?.islamic,
          science: mad?.teachers?.science,
        },
        classrooms: mad?.classrooms,
        hasLabs: mad?.hasLabs ?? false,
        hasLibrary: mad?.hasLibrary ?? false,
      },
      markazData: {
        disciplines: mar?.disciplines ?? [],
        studyLevels: mar?.studyLevels ?? [],
        daawahActivities: mar?.daawahActivities ?? false,
        students: mar?.students,
        scholars: mar?.scholars,
        hasBoarding: mar?.hasBoarding ?? false,
        hasLibrary: mar?.hasLibrary ?? false,
      },
    });
  }, [institution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

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
        capacity: formData.mosqueData.capacity ?? undefined,
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
          male: formData.madrasahData.students.male ?? undefined,
          female: formData.madrasahData.students.female ?? undefined,
        },
        teachers: {
          islamic: formData.madrasahData.teachers.islamic ?? undefined,
          science: formData.madrasahData.teachers.science ?? undefined,
        },
        classrooms: formData.madrasahData.classrooms ?? undefined,
      };
    } else if (formData.type === "MARKAZ") {
      submitData.markazData = {
        ...formData.markazData,
        disciplines: formData.markazData.disciplines,
        studyLevels: formData.markazData.studyLevels,
        students: formData.markazData.students ?? undefined,
        scholars: formData.markazData.scholars ?? undefined,
      };
    }

    updateMutation.mutate({ id, data: submitData });
  };

  const handleRegionChange = (regionId: string) => {
    setFormData((prev) => ({ ...prev, regionId, zoneId: "", woredaId: "" }));
  };
  const handleZoneChange = (zoneId: string) => {
    setFormData((prev) => ({ ...prev, zoneId, woredaId: "" }));
  };
  const handleWoredaChange = (woredaId: string) => {
    setFormData((prev) => ({ ...prev, woredaId }));
  };

  if (isLoading) {
    return <div className="p-6">Loading institution...</div>;
  }

  if (!institution) {
    return <div className="p-6">Institution not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/majlis/institutions/${id}`)}
              className="text-white/90 hover:text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Institution</h1>
              <p className="text-white/80 font-mono text-sm mt-0.5">{institution.institutionCode}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Basic Information</CardTitle>
            <CardDescription className="text-gray-600">Name, type, status, and ownership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label>Institution Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} disabled>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOSQUE">Mosque</SelectItem>
                    <SelectItem value="MADRASAH">Madrasah</SelectItem>
                    <SelectItem value="MARKAZ">Markaz</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Type cannot be changed after creation</p>
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as InstitutionStatus }))}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="UNDER_CONSTRUCTION">Under Construction</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Year Established</Label>
                <Input
                  type="number"
                  value={formData.yearEstablished}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      yearEstablished: e.target.value ? parseInt(e.target.value, 10) : new Date().getFullYear(),
                    }))
                  }
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label>Ownership Status</Label>
                <Select
                  value={formData.ownershipStatus}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, ownershipStatus: v as OwnershipStatus }))
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
          </CardContent>
        </Card>

        <Card className="shadow-md border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Geographic Location</CardTitle>
            <CardDescription className="text-gray-600">Region, zone, woreda, and GPS coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-medium text-gray-800">Location</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Use GPS location
                  </>
                )}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Region</Label>
                <Select value={formData.regionId} onValueChange={handleRegionChange}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select region" />
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
                    <SelectValue placeholder="Select zone" />
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
                    <SelectValue placeholder="Select woreda" />
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
            </div>
            <div>
              <Label>Kebele (optional – enter manually)</Label>
              <Input
                value={formData.kebeleName}
                onChange={(e) => setFormData((prev) => ({ ...prev, kebeleName: e.target.value }))}
                placeholder="e.g. Kebele 01, Bole"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label>Area / Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Neighborhood or street details"
                rows={2}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Latitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="9.1450"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Longitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="38.7617"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Type-specific fields */}
        {formData.type === "MOSQUE" && (
          <Card className="shadow-md border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Mosque Details</CardTitle>
              <CardDescription className="text-gray-600">Capacity, facilities, and utilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>Capacity (worshippers)</Label>
                <Input
                  type="number"
                  value={formData.mosqueData.capacity ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mosqueData: {
                        ...prev.mosqueData,
                        capacity: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      },
                    }))
                  }
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="jummah"
                    checked={formData.mosqueData.jummahAvailable}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        mosqueData: { ...prev.mosqueData, jummahAvailable: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="jummah" className="cursor-pointer">Friday Jummah available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="women-space"
                    checked={formData.mosqueData.womenPrayerSpace}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        mosqueData: { ...prev.mosqueData, womenPrayerSpace: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="women-space" className="cursor-pointer">Women prayer space</Label>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Utilities</Label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="water"
                      checked={formData.mosqueData.utilities.water}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          mosqueData: {
                            ...prev.mosqueData,
                            utilities: { ...prev.mosqueData.utilities, water: checked === true },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="water" className="cursor-pointer">Water</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="electricity"
                      checked={formData.mosqueData.utilities.electricity}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          mosqueData: {
                            ...prev.mosqueData,
                            utilities: { ...prev.mosqueData.utilities, electricity: checked === true },
                          },
                        }))
                      }
                    />
                    <Label htmlFor="electricity" className="cursor-pointer">Electricity</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === "MADRASAH" && (
          <Card className="shadow-md border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b py-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Madrasah Details</CardTitle>
              <CardDescription className="text-gray-600">Accreditation, grades, students, teachers, and facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>Accreditation status</Label>
                <Select
                  value={formData.madrasahData.accreditationStatus}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      madrasahData: {
                        ...prev.madrasahData,
                        accreditationStatus: v as "ACCREDITED" | "PROVISIONALLY_ACCREDITED" | "NOT_ACCREDITED",
                      },
                    }))
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCREDITED">Accredited</SelectItem>
                    <SelectItem value="PROVISIONALLY_ACCREDITED">Provisionally accredited</SelectItem>
                    <SelectItem value="NOT_ACCREDITED">Not accredited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade levels (select at least one)</Label>
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  {(["PRIMARY", "SECONDARY", "PREPARATORY"] as const).map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`madrasah-${level}`}
                        checked={formData.madrasahData.gradeLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          const current = formData.madrasahData.gradeLevels;
                          setFormData((prev) => ({
                            ...prev,
                            madrasahData: {
                              ...prev.madrasahData,
                              gradeLevels: checked === true
                                ? [...current, level]
                                : current.filter((l) => l !== level),
                            },
                          }));
                        }}
                      />
                      <Label htmlFor={`madrasah-${level}`} className="cursor-pointer capitalize">{level.toLowerCase()}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Students (male)</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.students.male ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: {
                          ...prev.madrasahData,
                          students: {
                            ...prev.madrasahData.students,
                            male: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          },
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label>Students (female)</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.students.female ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: {
                          ...prev.madrasahData,
                          students: {
                            ...prev.madrasahData.students,
                            female: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          },
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label>Teachers (Islamic)</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.teachers.islamic ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: {
                          ...prev.madrasahData,
                          teachers: {
                            ...prev.madrasahData.teachers,
                            islamic: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          },
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label>Teachers (Science)</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.teachers.science ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: {
                          ...prev.madrasahData,
                          teachers: {
                            ...prev.madrasahData.teachers,
                            science: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          },
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label>Classrooms</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.classrooms ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: {
                          ...prev.madrasahData,
                          classrooms: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="madrasah-labs"
                    checked={formData.madrasahData.hasLabs}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: { ...prev.madrasahData, hasLabs: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="madrasah-labs" className="cursor-pointer">Has labs</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="madrasah-library"
                    checked={formData.madrasahData.hasLibrary}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        madrasahData: { ...prev.madrasahData, hasLibrary: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="madrasah-library" className="cursor-pointer">Has library</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === "MARKAZ" && (
          <Card className="shadow-md border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Markaz Details</CardTitle>
              <CardDescription className="text-gray-600">Disciplines, study levels, and facilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label>Islamic disciplines (select at least one)</Label>
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  {(["QURAN", "HADITH", "TAFSIR", "FIQH", "AQEEDAH", "TARBIYA", "ARABIC"] as const).map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <Checkbox
                        id={`markaz-${d}`}
                        checked={formData.markazData.disciplines.includes(d)}
                        onCheckedChange={(checked) => {
                          const current = formData.markazData.disciplines;
                          setFormData((prev) => ({
                            ...prev,
                            markazData: {
                              ...prev.markazData,
                              disciplines: checked === true
                                ? [...current, d]
                                : current.filter((x) => x !== d),
                            },
                          }));
                        }}
                      />
                      <Label htmlFor={`markaz-${d}`} className="cursor-pointer capitalize">{d.toLowerCase()}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Study levels (select at least one)</Label>
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`markaz-level-${level}`}
                        checked={formData.markazData.studyLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          const current = formData.markazData.studyLevels;
                          setFormData((prev) => ({
                            ...prev,
                            markazData: {
                              ...prev.markazData,
                              studyLevels: checked === true
                                ? [...current, level]
                                : current.filter((l) => l !== level),
                            },
                          }));
                        }}
                      />
                      <Label htmlFor={`markaz-level-${level}`} className="cursor-pointer capitalize">{level.toLowerCase()}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Number of students</Label>
                  <Input
                    type="number"
                    value={formData.markazData.students ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        markazData: {
                          ...prev.markazData,
                          students: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label>Number of scholars</Label>
                  <Input
                    type="number"
                    value={formData.markazData.scholars ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        markazData: {
                          ...prev.markazData,
                          scholars: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        },
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="markaz-daawah"
                    checked={formData.markazData.daawahActivities}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        markazData: { ...prev.markazData, daawahActivities: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="markaz-daawah" className="cursor-pointer">Da&apos;wah activities</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="markaz-boarding"
                    checked={formData.markazData.hasBoarding}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        markazData: { ...prev.markazData, hasBoarding: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="markaz-boarding" className="cursor-pointer">Has boarding</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="markaz-library"
                    checked={formData.markazData.hasLibrary}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        markazData: { ...prev.markazData, hasLibrary: checked === true },
                      }))
                    }
                  />
                  <Label htmlFor="markaz-library" className="cursor-pointer">Has library</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/majlis/institutions/${id}`)}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}


