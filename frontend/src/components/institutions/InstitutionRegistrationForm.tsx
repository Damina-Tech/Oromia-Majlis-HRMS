"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation } from "lucide-react";
import OromiaLocationPicker from "@/components/location/OromiaLocationPicker";
import { resolveOromiaLocationIds } from "@/services/oromia-location";
import type {
  InstitutionCreatePayload,
  InstitutionStatus,
  InstitutionType,
  OwnershipStatus,
} from "@/services/institutions";

const CONTACT_ROLES = [
  "Imam",
  "Muazzin",
  "Mosque committee member",
  "Madrasah director",
  "Madrasah board member",
  "Markaz director",
  "Community representative",
  "Other",
] as const;

export type InstitutionRegistrationFormProps = {
  variant?: "admin" | "public";
  onSubmit: (data: InstitutionCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export default function InstitutionRegistrationForm({
  variant = "admin",
  onSubmit,
  onCancel,
  isSubmitting: parentSubmitting = false,
  submitLabel,
}: InstitutionRegistrationFormProps) {
  const isPublic = variant === "public";
  const [formData, setFormData] = useState({
    name: "",
    type: "MOSQUE" as InstitutionType,
    status: (isPublic ? "ACTIVE" : "ACTIVE") as InstitutionStatus,
    address: "",
    latitude: "",
    longitude: "",
    yearEstablished: new Date().getFullYear(),
    ownershipStatus: "COMMUNITY_OWNED" as OwnershipStatus,
    oromiaZone: "",
    oromiaDistrict: "",
    kebeleName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactRole: "",
    password: "",
    confirmPassword: "",
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

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const busy = isResolving || parentSubmitting;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oromiaZone.trim() || !formData.oromiaDistrict.trim()) {
      toast.error("Please select zone and district");
      return;
    }
    if (isPublic) {
      if (!formData.contactName.trim() || !formData.contactPhone.trim() || !formData.contactRole.trim()) {
        toast.error("Please fill in your name, phone, and role");
        return;
      }
      if (!formData.contactEmail.trim()) {
        toast.error("Email is required to create your login account");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (!imageFile) {
        toast.error("Please upload an institution / mosque image");
        return;
      }
      if (!formData.address.trim()) {
        toast.error("Institution area (Kare) is required");
        return;
      }
    }
    if (formData.type === "MADRASAH" && formData.madrasahData.gradeLevels.length === 0) {
      toast.error("Select at least one Madrasah grade level");
      return;
    }
    if (formData.type === "MARKAZ") {
      if (formData.markazData.disciplines.length === 0) {
        toast.error("Select at least one Markaz discipline");
        return;
      }
      if (formData.markazData.studyLevels.length === 0) {
        toast.error("Select at least one Markaz study level");
        return;
      }
    }

    setIsResolving(true);
    let regionId: string;
    let zoneId: string;
    let woredaId: string;
    try {
      const resolved = await resolveOromiaLocationIds(
        formData.oromiaZone,
        formData.oromiaDistrict,
        isPublic ? "public" : "institutions"
      );
      regionId = resolved.regionId;
      zoneId = resolved.zoneId;
      woredaId = resolved.woredaId;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? "Failed to resolve location");
      setIsResolving(false);
      return;
    }
    setIsResolving(false);

    try {
      const submitData: InstitutionCreatePayload = {
        name: formData.name.trim(),
        type: formData.type,
        status: formData.status,
        address: formData.address || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        yearEstablished: formData.yearEstablished,
        ownershipStatus: formData.ownershipStatus,
        regionId,
        zoneId,
        woredaId,
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

      if (isPublic) {
        submitData.submitter = {
          name: formData.contactName.trim(),
          phone: formData.contactPhone.trim(),
          email: formData.contactEmail.trim(),
          role: formData.contactRole.trim(),
        };
        submitData.password = formData.password;
        submitData.imageFile = imageFile!;
        submitData.status = formData.status;
      }

      await onSubmit(submitData);
    } catch {
      // Caller (admin mutation or public page) shows the error toast
    }
  };

  const fieldClass = "border-gray-300 focus:border-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPublic && (
        <div className="space-y-4 p-4 border rounded-lg bg-indigo-50/70 dark:bg-indigo-950/20">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Account & contact details</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create your login account and provide contact information for follow-up.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full name *</Label>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
                className={fieldClass}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Phone number *</Label>
              <Input
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                required
                className={fieldClass}
                placeholder="09xxxxxxxx"
              />
            </div>
            <div>
              <Label>Email (login) *</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
                className={fieldClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label>Your role at the institution *</Label>
              <Select
                value={formData.contactRole || undefined}
                onValueChange={(v) => setFormData({ ...formData, contactRole: v })}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className={fieldClass}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label>Confirm password *</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={8}
                className={fieldClass}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label>Institution Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={fieldClass}
            placeholder="Official mosque, madrasah, or markaz name"
          />
        </div>

        {!isPublic && (
          <div>
            <Label>Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as InstitutionStatus })}
            >
              <SelectTrigger className={fieldClass}>
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
        )}

        {isPublic && (
          <div>
            <Label>Institution status *</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as InstitutionStatus })}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active / Operating</SelectItem>
                <SelectItem value="UNDER_CONSTRUCTION">Under Construction</SelectItem>
                <SelectItem value="SUSPENDED">Temporarily Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isPublic && (
          <div>
            <Label>Institution / mosque image *</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={fieldClass}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload a clear photo of the institution (JPEG, PNG, or WebP, max 5MB).
            </p>
          </div>
        )}

        <div>
          <Label>Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => {
              const newType = v as InstitutionType;
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
            <SelectTrigger className={fieldClass}>
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
              className={fieldClass}
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
              <SelectTrigger className={fieldClass}>
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

        <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Geographic Location</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
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
          <OromiaLocationPicker
            required
            value={{
              zone: formData.oromiaZone,
              district: formData.oromiaDistrict,
              kebele: formData.kebeleName,
            }}
            onChange={(loc) =>
              setFormData({
                ...formData,
                oromiaZone: loc.zone,
                oromiaDistrict: loc.district,
                kebeleName: loc.kebele ?? "",
              })
            }
            showKebele
            kebeleLabel="Kebele (optional)"
            kebelePlaceholder="e.g. Kebele 01, Bole, etc."
            districtLabel="District / Woreda"
          />
          <div>
            <Label>{isPublic ? "Area (Kare) *" : "Area (Optional)"}</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={fieldClass}
              rows={2}
              required={isPublic}
              placeholder="Enter Kare / area or neighborhood details"
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
                className={fieldClass}
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
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      </div>

      {formData.type === "MOSQUE" && (
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Mosque Details</h3>
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
              className={fieldClass}
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

      {formData.type === "MADRASAH" && (
        <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Madrasah Details</h3>
          <div>
            <Label>Accreditation Status *</Label>
            <Select
              value={formData.madrasahData.accreditationStatus}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  madrasahData: {
                    ...formData.madrasahData,
                    accreditationStatus: v as "ACCREDITED" | "PROVISIONALLY_ACCREDITED" | "NOT_ACCREDITED",
                  },
                })
              }
            >
              <SelectTrigger className={fieldClass}>
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
            <div className="border rounded-lg p-3 bg-white dark:bg-slate-950">
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
                className={fieldClass}
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
                className={fieldClass}
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
                className={fieldClass}
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
                className={fieldClass}
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
                className={fieldClass}
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

      {formData.type === "MARKAZ" && (
        <div className="space-y-4 p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Markaz Details</h3>
          <div>
            <Label>Islamic Disciplines * (Select at least one)</Label>
            <div className="border rounded-lg p-3 bg-white dark:bg-slate-950">
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
            <div className="border rounded-lg p-3 bg-white dark:bg-slate-950">
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
                className={fieldClass}
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
                className={fieldClass}
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
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isPublic ? "Submitting…" : "Saving…"}
            </>
          ) : (
            submitLabel ?? (isPublic ? "Submit registration" : "Create Institution")
          )}
        </Button>
      </div>
    </form>
  );
}
