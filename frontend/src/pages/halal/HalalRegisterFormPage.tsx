"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Building2, MapPin, Navigation, Loader2 } from "lucide-react";
import { halalApi, type HalalBusinessCategory } from "@/services/halal";
import { regionsApi } from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIES: HalalBusinessCategory[] = [
  "FOOD",
  "DRINKS",
  "COSMETICS",
  "MEDICINE",
  "RESTAURANT",
  "FACTORY",
  "SLAUGHTERHOUSE",
];

export default function HalalRegisterFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: "",
    category: "FOOD" as HalalBusinessCategory,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    regionId: "",
    zoneId: "",
    woredaId: "",
    kebeleName: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["halal-business", id],
    queryFn: () => halalApi.businesses.get(id!),
    enabled: isEdit,
  });

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => regionsApi.list(),
  });
  const selectedRegion = regions?.find((r) => r.id === formData.regionId);
  const selectedZone = selectedRegion?.zones?.find((z) => z.id === formData.zoneId);

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        category: business.category,
        contactName: business.contactName,
        contactEmail: business.contactEmail,
        contactPhone: business.contactPhone,
        regionId: business.regionId || "",
        zoneId: business.zoneId || "",
        woredaId: business.woredaId || "",
        kebeleName: business.kebeleName || "",
        address: business.address || "",
        latitude: business.latitude?.toString() || "",
        longitude: business.longitude?.toString() || "",
      });
    }
  }, [business]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsGettingLocation(false);
        toast.success("Location captured");
      },
      () => {
        setIsGettingLocation(false);
        toast.error("Failed to get location");
      }
    );
  };

  const createMutation = useMutation({
    mutationFn: halalApi.businesses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      toast.success("Business registered successfully");
      navigate("/halal/register");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Registration failed"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof halalApi.businesses.update>[1]) =>
      halalApi.businesses.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
      toast.success("Business updated successfully");
      navigate("/halal/register");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      regionId: formData.regionId || undefined,
      zoneId: formData.zoneId || undefined,
      woredaId: formData.woredaId || undefined,
      kebeleName: formData.kebeleName || undefined,
      address: formData.address || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingBusiness) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEdit && !business) {
    return (
      <div className="p-6">
        <p>Business not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/halal/register")}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/register")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {isEdit ? "Edit Business" : "Register Business"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit ? "Update your business details" : "Enter your business details to register"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>Enter your business details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Business Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Ethiopian Halal Foods PLC"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((p) => ({ ...p, category: v as HalalBusinessCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Contact Name *</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Contact Phone *</Label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation}>
                  {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  {isGettingLocation ? "Getting..." : "Use GPS"}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Region</Label>
                  <Select
                    value={formData.regionId}
                    onValueChange={(v) => setFormData((p) => ({ ...p, regionId: v, zoneId: "", woredaId: "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                    <SelectContent>
                      {regions?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zone</Label>
                  <Select
                    value={formData.zoneId}
                    onValueChange={(v) => setFormData((p) => ({ ...p, zoneId: v, woredaId: "" }))}
                    disabled={!formData.regionId}
                  >
                    <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
                    <SelectContent>
                      {selectedRegion?.zones?.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Woreda</Label>
                  <Select
                    value={formData.woredaId}
                    onValueChange={(v) => setFormData((p) => ({ ...p, woredaId: v }))}
                    disabled={!formData.zoneId}
                  >
                    <SelectTrigger><SelectValue placeholder="Woreda" /></SelectTrigger>
                    <SelectContent>
                      {selectedZone?.woredas?.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Kebele / Address</Label>
                <Textarea
                  value={formData.kebeleName || formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, kebeleName: e.target.value, address: e.target.value }))}
                  placeholder="Area, kebele, or full address"
                  rows={2}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/halal/register")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Update Business" : "Register Business"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
