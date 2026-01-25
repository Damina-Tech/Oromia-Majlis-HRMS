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
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import {
  institutionsApi,
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
    kebeleId: "",
    // Type-specific data
    mosqueData: {} as any,
    madrasahData: {} as any,
    markazData: {} as any,
  });

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name || "",
        type: institution.type,
        status: institution.status,
        address: institution.address || "",
        latitude: institution.latitude ? String(institution.latitude) : "",
        longitude: institution.longitude ? String(institution.longitude) : "",
        yearEstablished: institution.yearEstablished || new Date().getFullYear(),
        ownershipStatus: institution.ownershipStatus || "MAJLIS_OWNED",
        regionId: institution.regionId || "",
        zoneId: institution.zoneId || "",
        woredaId: institution.woredaId || "",
        kebeleId: institution.kebeleId || "",
        mosqueData: institution.mosqueData || {},
        madrasahData: institution.madrasahData || {},
        markazData: institution.markazData || {},
      });
    }
  }, [institution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const submitData: any = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      address: formData.address,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      yearEstablished: formData.yearEstablished,
      ownershipStatus: formData.ownershipStatus,
      regionId: formData.regionId || undefined,
      zoneId: formData.zoneId || undefined,
      woredaId: formData.woredaId || undefined,
      kebeleId: formData.kebeleId || undefined,
    };

    if (formData.type === "MOSQUE") {
      submitData.mosqueData = formData.mosqueData;
    } else if (formData.type === "MADRASAH") {
      submitData.madrasahData = formData.madrasahData;
    } else if (formData.type === "MARKAZ") {
      submitData.markazData = formData.markazData;
    }

    updateMutation.mutate({ id, data: submitData });
  };

  if (isLoading) {
    return <div className="p-6">Loading institution...</div>;
  }

  if (!institution) {
    return <div className="p-6">Institution not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/majlis/institutions/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Institution</h1>
          <p className="text-muted-foreground">{institution.institutionCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update institution details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                disabled
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
              <p className="text-xs text-muted-foreground mt-1">Type cannot be changed after creation</p>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as InstitutionStatus })}
              >
                <SelectTrigger>
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

            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="9.1450"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="38.7617"
                />
              </div>
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
                  <SelectTrigger>
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

        {/* Type-specific fields */}
        {formData.type === "MOSQUE" && (
          <Card>
            <CardHeader>
              <CardTitle>Mosque Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.mosqueData.jummahAvailable || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mosqueData: { ...formData.mosqueData, jummahAvailable: e.target.checked },
                      })
                    }
                  />
                  <Label>Friday Jummah Available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.mosqueData.womenPrayerSpace || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mosqueData: { ...formData.mosqueData, womenPrayerSpace: e.target.checked },
                      })
                    }
                  />
                  <Label>Women Prayer Space</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === "MADRASAH" && (
          <Card>
            <CardHeader>
              <CardTitle>Madrasah Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                <div>
                  <Label>Number of Students (Female)</Label>
                  <Input
                    type="number"
                    value={formData.madrasahData.students?.female || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        madrasahData: {
                          ...formData.madrasahData,
                          students: {
                            ...formData.madrasahData.students,
                            female: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === "MARKAZ" && (
          <Card>
            <CardHeader>
              <CardTitle>Markaz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div>
                <Label>Number of Scholars</Label>
                <Input
                  type="number"
                  value={formData.markazData.scholars || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      markazData: { ...formData.markazData, scholars: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/majlis/institutions/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}


