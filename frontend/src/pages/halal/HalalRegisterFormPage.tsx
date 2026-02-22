"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Building2,
  MapPin,
  Navigation,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  FileText,
  Package,
  PenLine,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { halalApi, type HalalBusinessCategory } from "@/services/halal";
import { regionsApi } from "@/services/institutions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GoogleMapEmbed from "@/components/institutions/GoogleMapEmbed";
import { resolveFileUrl } from "@/config/api";

const DRAFT_KEY = "halal-registration-draft";

const FIELD_LABELS: Record<string, string> = {
  name: "Business name",
  contactName: "Full name",
  contactEmail: "Email address",
  contactPhone: "Phone number",
  category: "Business category",
  tinNumber: "TIN number",
  declarationSignature: "Digital signature",
  address: "Address",
  regionId: "Region",
  zoneId: "Zone",
  woredaId: "Woreda",
  kebeleName: "Kebele",
  businessId: "Business",
  productList: "Products",
};

function getValidationErrorMessage(error: unknown): string {
  const data = (error as any)?.response?.data;
  if (!data) return (error as Error)?.message || "Something went wrong. Please try again.";

  let issues: Array<{ path?: (string | number)[]; message?: string; code?: string }> = [];
  if (Array.isArray(data)) {
    issues = data;
  } else if (Array.isArray(data.errors)) {
    issues = data.errors;
  } else if (typeof data.message === "string") {
    try {
      const parsed = JSON.parse(data.message);
      if (Array.isArray(parsed)) issues = parsed;
    } catch {
      return data.message;
    }
  } else {
    return data.message || "Something went wrong. Please try again.";
  }

  if (issues.length === 0) return data.message || "Please check the form and try again.";

  const messages = issues.map((issue) => {
    const path = issue.path?.[0];
    const field = typeof path === "string" ? (FIELD_LABELS[path] || path) : "Field";
    if (issue.code === "too_small" || issue.message?.toLowerCase().includes("too small")) {
      return `${field} is required.`;
    }
    if (issue.code === "invalid_string" && issue.message?.includes("email")) {
      return "Please enter a valid email address.";
    }
    if (issue.code === "invalid_enum_value") {
      return `Please select a valid ${field.toLowerCase()}.`;
    }
    return `${field}: ${issue.message || "Please provide a value."}`;
  });

  const unique = [...new Set(messages)];
  return unique.length === 1 ? unique[0] : `Please fix the following: ${unique.join(" ")}`;
}
const STEPS = [
  { id: 1, title: "Owner Information", icon: User, color: "emerald" },
  { id: 2, title: "Business & Documents", icon: Building2, color: "blue" },
  { id: 3, title: "Products / Services", icon: Package, color: "violet" },
  { id: 4, title: "Declaration & Signature", icon: PenLine, color: "amber" },
  { id: 5, title: "Review & Submit", icon: CheckCircle2, color: "teal" },
];

const STEP_COLORS: Record<string, { active: string; completed: string; line: string }> = {
  emerald: { active: "bg-emerald-600 text-white shadow-lg ring-emerald-400", completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800/50", line: "bg-emerald-500 dark:bg-emerald-500/80" },
  blue: { active: "bg-blue-600 text-white shadow-lg ring-blue-400", completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50", line: "bg-blue-500 dark:bg-blue-500/80" },
  violet: { active: "bg-violet-600 text-white shadow-lg ring-violet-400", completed: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-800/50", line: "bg-violet-500 dark:bg-violet-500/80" },
  amber: { active: "bg-amber-600 text-white shadow-lg ring-amber-400", completed: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50", line: "bg-amber-500 dark:bg-amber-500/80" },
  teal: { active: "bg-teal-600 text-white shadow-lg ring-teal-400", completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-800/50", line: "bg-teal-500 dark:bg-teal-500/80" },
};

const CATEGORIES: HalalBusinessCategory[] = [
  "FOOD",
  "DRINKS",
  "COSMETICS",
  "MEDICINE",
  "RESTAURANT",
  "FACTORY",
  "SLAUGHTERHOUSE",
];

const BUSINESS_TYPES = ["Private", "PLC", "Cooperative", "Branch"];
const OWNER_ROLES = ["Owner", "Manager", "Representative"];
const GENDERS = ["Male", "Female", "Other"];

interface ProductItem {
  id: string;
  name: string;
  category: string;
  ingredients: string;
  sourceOfIngredients: string;
  supplierName: string;
  countryOfOrigin: string;
  productionMethod: string;
  packagingType: string;
  storageMethod: string;
}

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <>
    {children} <span className="text-red-500">*</span>
  </>
);

const emptyProduct = (): ProductItem => ({
  id: crypto.randomUUID(),
  name: "",
  category: "FOOD",
  ingredients: "",
  sourceOfIngredients: "",
  supplierName: "",
  countryOfOrigin: "",
  productionMethod: "",
  packagingType: "",
  storageMethod: "",
});

function parseProductFromApplication(p: { name: string; description?: string }): ProductItem {
  const desc = p.description || "";
  const parts = desc.split(" | ");
  const getVal = (prefix: string) => {
    const found = parts.find((x) => x.startsWith(prefix));
    return found ? found.slice(prefix.length).trim() : "";
  };
  const cat = parts[0] && CATEGORIES.includes(parts[0] as HalalBusinessCategory) ? parts[0] : "FOOD";
  return {
    id: crypto.randomUUID(),
    name: p.name,
    category: cat,
    ingredients: getVal("Ingredients: "),
    sourceOfIngredients: getVal("Source: "),
    supplierName: getVal("Supplier: "),
    countryOfOrigin: getVal("Origin: "),
    productionMethod: getVal("Method: "),
    packagingType: getVal("Packaging: "),
    storageMethod: getVal("Storage: "),
  };
}

interface FormData {
  // Step 1: Owner
  fullName: string;
  nationalId: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  homeAddress: string;
  role: string;
  // Step 2: Business
  businessName: string;
  brandName: string;
  category: HalalBusinessCategory;
  yearEstablished: string;
  businessType: string;
  regionId: string;
  zoneId: string;
  woredaId: string;
  kebeleName: string;
  address: string;
  latitude: string;
  longitude: string;
  tinNumber: string;
  // Documents (file URLs after upload)
  businessLicenseFile: File | null;
  businessLicenseUrl: string;
  registrationCertFile: File | null;
  registrationCertUrl: string;
  tinCertFile: File | null;
  tinCertUrl: string;
  ownerIdFile: File | null;
  ownerIdUrl: string;
  // Step 3: Products
  products: ProductItem[];
  // Step 4: Declaration
  declNoAlcohol: boolean;
  declNoProhibited: boolean;
  declMajlisCompliance: boolean;
  declDataAccurate: boolean;
  signatureData: string;
}

const initialFormData: FormData = {
  fullName: "",
  nationalId: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
  emailAddress: "",
  homeAddress: "",
  role: "Owner",
  businessName: "",
  brandName: "",
  category: "FOOD",
  yearEstablished: "",
  businessType: "Private",
  regionId: "",
  zoneId: "",
  woredaId: "",
  kebeleName: "",
  address: "",
  latitude: "",
  longitude: "",
  tinNumber: "",
  businessLicenseFile: null,
  businessLicenseUrl: "",
  registrationCertFile: null,
  registrationCertUrl: "",
  tinCertFile: null,
  tinCertUrl: "",
  ownerIdFile: null,
  ownerIdUrl: "",
  products: [emptyProduct()],
  declNoAlcohol: false,
  declNoProhibited: false,
  declMajlisCompliance: false,
  declDataAccurate: false,
  signatureData: "",
};

function loadDraft(id: string | undefined): Partial<FormData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY + (id ? `-${id}` : ""));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    delete parsed.businessLicenseFile;
    delete parsed.registrationCertFile;
    delete parsed.tinCertFile;
    delete parsed.ownerIdFile;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(data: FormData, id: string | undefined) {
  try {
    const toSave = { ...data };
    (toSave as any).businessLicenseFile = null;
    (toSave as any).registrationCertFile = null;
    (toSave as any).tinCertFile = null;
    (toSave as any).ownerIdFile = null;
    localStorage.setItem(DRAFT_KEY + (id ? `-${id}` : ""), JSON.stringify(toSave));
  } catch {}
}

export default function HalalRegisterFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

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

  useEffect(() => {
    if (isEdit && business) {
      const b = business as import("@/services/halal").HalalBusiness & { productList?: { name: string; description?: string }[]; documents?: { name: string; url: string }[] };
      const dob = b.ownerDateOfBirth ? new Date(b.ownerDateOfBirth).toISOString().slice(0, 10) : "";
      const productList = (b.productList || []).filter((x) => x && x.name);
      const products =
        productList.length > 0
          ? productList.map(parseProductFromApplication)
          : [emptyProduct()];
      const docs = (b.documents || []) as { name: string; url: string }[];
      const docUrl = (name: string) => docs.find((d) => d.name === name)?.url || "";
      setFormData((p) => ({
        ...p,
        fullName: business.contactName || "",
        nationalId: b.ownerNationalId || "",
        gender: b.ownerGender || "",
        dateOfBirth: dob,
        emailAddress: business.contactEmail || "",
        phoneNumber: business.contactPhone || "",
        homeAddress: b.ownerHomeAddress || "",
        role: b.ownerRole || p.role,
        businessName: business.name,
        brandName: b.brandName || "",
        category: business.category,
        yearEstablished: b.yearEstablished?.toString() || "",
        businessType: b.businessType || p.businessType,
        tinNumber: b.tinNumber || "",
        regionId: business.regionId || "",
        zoneId: business.zoneId || "",
        woredaId: business.woredaId || "",
        kebeleName: business.kebeleName || "",
        address: business.address || "",
        latitude: business.latitude?.toString() || "",
        longitude: business.longitude?.toString() || "",
        businessLicenseUrl: b.licenseUrl || "",
        registrationCertUrl: docUrl("Registration Certificate"),
        tinCertUrl: docUrl("TIN Certificate"),
        ownerIdUrl: docUrl("Owner ID/Passport"),
        products,
        signatureData: b.declarationSignature || "",
      }));
    } else if (!isEdit) {
      const draft = loadDraft(id);
      if (draft) {
        setFormData((p) => ({ ...p, ...draft, products: draft.products || p.products }));
      }
    }
  }, [business, isEdit, id]);

  const saveDraftToStorage = useCallback(() => {
    saveDraft(formData, id);
  }, [formData, id]);

  useEffect(() => {
    const t = setTimeout(saveDraftToStorage, 500);
    return () => clearTimeout(t);
  }, [formData, saveDraftToStorage]);

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
      localStorage.removeItem(DRAFT_KEY + (id ? `-${id}` : ""));
      toast.success("Business registered successfully");
      navigate("/halal/register");
    },
    onError: (e: any) => toast.error(getValidationErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof halalApi.businesses.update>[1]) =>
      halalApi.businesses.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
      localStorage.removeItem(DRAFT_KEY + (id ? `-${id}` : ""));
      toast.success("Business updated successfully");
      navigate("/halal/register");
    },
    onError: (e: any) => toast.error(getValidationErrorMessage(e)),
  });

  const handleSubmit = async () => {
    const lat = formData.latitude ? parseFloat(formData.latitude) : undefined;
    const lng = formData.longitude ? parseFloat(formData.longitude) : undefined;
    const yearEst = formData.yearEstablished ? parseInt(formData.yearEstablished, 10) : undefined;
    const businessPayload = {
      name: formData.businessName,
      category: formData.category,
      contactName: formData.fullName,
      contactEmail: formData.emailAddress,
      contactPhone: formData.phoneNumber,
      regionId: formData.regionId || undefined,
      zoneId: formData.zoneId || undefined,
      woredaId: formData.woredaId || undefined,
      kebeleName: formData.kebeleName || undefined,
      address: formData.address || undefined,
      latitude: lat,
      longitude: lng,
      ownerNationalId: formData.nationalId || undefined,
      ownerGender: formData.gender || undefined,
      ownerDateOfBirth: formData.dateOfBirth || undefined,
      ownerHomeAddress: formData.homeAddress || undefined,
      ownerRole: formData.role || undefined,
      brandName: formData.brandName || undefined,
      yearEstablished: yearEst,
      businessType: formData.businessType || undefined,
      tinNumber: formData.tinNumber || undefined,
      declarationSignature: formData.signatureData || undefined,
    };

    const buildProductList = () =>
      formData.products
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name,
          description: [
            p.category,
            p.ingredients && `Ingredients: ${p.ingredients}`,
            p.sourceOfIngredients && `Source: ${p.sourceOfIngredients}`,
            p.supplierName && `Supplier: ${p.supplierName}`,
            p.countryOfOrigin && `Origin: ${p.countryOfOrigin}`,
            p.productionMethod && `Method: ${p.productionMethod}`,
            p.packagingType && `Packaging: ${p.packagingType}`,
            p.storageMethod && `Storage: ${p.storageMethod}`,
          ]
            .filter(Boolean)
            .join(" | "),
        }));

    const buildDocuments = async (): Promise<{ name: string; url: string }[]> => {
      const docs: { name: string; url: string }[] = [];
      if (formData.registrationCertFile) {
        const r = await halalApi.businesses.uploadDocument(formData.registrationCertFile);
        docs.push({ name: "Registration Certificate", url: r.url });
      } else if (formData.registrationCertUrl) {
        docs.push({ name: "Registration Certificate", url: formData.registrationCertUrl });
      }
      if (formData.tinCertFile) {
        const r = await halalApi.businesses.uploadDocument(formData.tinCertFile);
        docs.push({ name: "TIN Certificate", url: r.url });
      } else if (formData.tinCertUrl) {
        docs.push({ name: "TIN Certificate", url: formData.tinCertUrl });
      }
      if (formData.ownerIdFile) {
        const r = await halalApi.businesses.uploadDocument(formData.ownerIdFile);
        docs.push({ name: "Owner ID/Passport", url: r.url });
      } else if (formData.ownerIdUrl) {
        docs.push({ name: "Owner ID/Passport", url: formData.ownerIdUrl });
      }
      return docs;
    };

    if (isEdit) {
      setIsSubmittingForm(true);
      try {
        const documents = await buildDocuments();
        const productList = buildProductList();
        await halalApi.businesses.update(id!, {
          ...businessPayload,
          productList: productList.length > 0 ? productList : undefined,
          documents: documents.length > 0 ? documents : undefined,
        });
        if (formData.businessLicenseFile) {
          await halalApi.businesses.uploadLicense(id!, formData.businessLicenseFile);
        }
        queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
        queryClient.invalidateQueries({ queryKey: ["halal-business", id] });
        localStorage.removeItem(DRAFT_KEY + (id ? `-${id}` : ""));
        toast.success("Business updated successfully");
        navigate("/halal/register");
      } catch (e: any) {
        toast.error(getValidationErrorMessage(e));
      } finally {
        setIsSubmittingForm(false);
      }
      return;
    }

    setIsSubmittingForm(true);
    try {
      const documents = await buildDocuments();
      const productList = buildProductList();
      const created = await halalApi.businesses.create({
        ...businessPayload,
        productList: productList.length > 0 ? productList : undefined,
        documents: documents.length > 0 ? documents : undefined,
      });
      if (formData.businessLicenseFile) {
        await halalApi.businesses.uploadLicense(created.id, formData.businessLicenseFile);
      }
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Business registered successfully. Awaiting admin approval before you can apply for Halal certification.");
      navigate("/halal/register");
    } catch (e: any) {
      toast.error(getValidationErrorMessage(e));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return (
        formData.fullName.trim() &&
        formData.phoneNumber.trim() &&
        formData.emailAddress.trim()
      );
    }
    if (currentStep === 2) {
      const hasLicense = !!formData.businessLicenseFile || !!formData.businessLicenseUrl;
      return formData.businessName.trim() && formData.category && formData.tinNumber.trim() && hasLicense;
    }
    if (currentStep === 4) {
      return (
        formData.declNoAlcohol &&
        formData.declNoProhibited &&
        formData.declMajlisCompliance &&
        formData.declDataAccurate &&
        formData.signatureData.trim()
      );
    }
    return true;
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || isSubmittingForm;

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

  const lat = formData.latitude ? parseFloat(formData.latitude) : NaN;
  const lng = formData.longitude ? parseFloat(formData.longitude) : NaN;
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-600/20 dark:via-teal-600/10 border border-emerald-200/50 dark:border-emerald-800/30 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/halal/register")} className="text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {isEdit ? "Edit Business" : "Register Business"}
            </h1>
            <p className="text-emerald-700/80 dark:text-emerald-300/80 text-sm">
              Step {currentStep} of 5 — {STEPS[currentStep - 1].title}
            </p>
          </div>
        </div>
      </div>

      {/* Step progress - full width with connecting lines */}
      <Card className="mb-8 border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center w-full">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const colors = STEP_COLORS[step.color];
              const active = step.id === currentStep;
              const completed = step.id < currentStep;
              const isLast = idx === STEPS.length - 1;
              const lineCompleted = completed ? colors.line : "bg-muted";
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center shrink-0 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => completed && setCurrentStep(step.id)}
                      className={`group flex flex-col items-center gap-1 px-2 py-3 rounded-xl w-full max-w-[120px] sm:max-w-none transition-all ${
                        active
                          ? `${colors.active} shadow-lg ring-2 ring-offset-2 dark:ring-offset-background`
                          : completed
                          ? `${colors.completed} cursor-pointer`
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
                        active ? "bg-white/25" : completed ? "bg-current/20" : ""
                      }`}>
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      <span className="text-xs font-semibold">Step {step.id}</span>
                    </button>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-[2] min-w-[20px] h-1 rounded-full self-center -mt-5 sm:-mt-6 ${lineCompleted}`}
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Identify the legal and responsible person"}
            {currentStep === 2 && "Verify business legality and location"}
            {currentStep === 3 && "Evaluate Halal compliance for products/services"}
            {currentStep === 4 && "Legal and religious accountability"}
            {currentStep === 5 && "Review all information before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label><RequiredLabel>Full Name</RequiredLabel></Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Legal name"
                    required
                  />
                </div>
                <div>
                  <Label>National ID(FAN) / Passport Number</Label>
                  <Input
                    value={formData.nationalId}
                    onChange={(e) => setFormData((p) => ({ ...p, nationalId: e.target.value }))}
                    placeholder="ID or passport"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData((p) => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label><RequiredLabel>Role</RequiredLabel></Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OWNER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label><RequiredLabel>Phone Number</RequiredLabel></Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label><RequiredLabel>Email Address</RequiredLabel></Label>
                  <Input
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData((p) => ({ ...p, emailAddress: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Home Address</Label>
                <Textarea
                  value={formData.homeAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, homeAddress: e.target.value }))}
                  rows={2}
                  placeholder="Full home address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Business & Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Business Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label><RequiredLabel>Business Name</RequiredLabel></Label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))}
                      placeholder="Legal business name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Brand / Trade Name</Label>
                    <Input
                      value={formData.brandName}
                      onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label><RequiredLabel>Business Category</RequiredLabel></Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData((p) => ({ ...p, category: v as HalalBusinessCategory }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year Established</Label>
                    <Input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearEstablished}
                      onChange={(e) => setFormData((p) => ({ ...p, yearEstablished: e.target.value }))}
                      placeholder="e.g. 2020"
                    />
                  </div>
                  <div>
                    <Label>Business Type</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(v) => setFormData((p) => ({ ...p, businessType: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
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
                <div className="mt-4">
                  <Label>Kebele / Area</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                    rows={2}
                    placeholder="Street, kebele, or area"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="grid gap-2 sm:grid-cols-2 flex-1 min-w-[200px]">
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
                  <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation} className="self-end">
                    {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    {isGettingLocation ? "Getting..." : "Use GPS"}
                  </Button>
                </div>
                {hasValidCoords && (
                  <div className="mt-4">
                    <GoogleMapEmbed latitude={lat} longitude={lng} title="Business location" height={220} zoom={14} />
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Required Uploads (PDF/Image)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label><RequiredLabel>TIN Number</RequiredLabel></Label>
                    <Input
                      value={formData.tinNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, tinNumber: e.target.value }))}
                      placeholder="Unique TIN number per business"
                    />
                  </div>
                  {[
                    {
                      key: "businessLicenseFile",
                      label: "Business License",
                      file: formData.businessLicenseFile,
                      existingUrl: formData.businessLicenseUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, businessLicenseFile: f })),
                      required: !formData.businessLicenseUrl,
                    },
                    {
                      key: "registrationCertFile",
                      label: "Registration Certificate",
                      file: formData.registrationCertFile,
                      existingUrl: formData.registrationCertUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, registrationCertFile: f })),
                      required: false,
                    },
                    {
                      key: "tinCertFile",
                      label: "TIN Certificate",
                      file: formData.tinCertFile,
                      existingUrl: formData.tinCertUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, tinCertFile: f })),
                      required: false,
                    },
                    {
                      key: "ownerIdFile",
                      label: "Owner ID/Passport",
                      file: formData.ownerIdFile,
                      existingUrl: formData.ownerIdUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, ownerIdFile: f })),
                      required: false,
                    },
                  ].map(({ key: docKey, label, file, existingUrl, set, required }) => (
                    <div key={docKey}>
                      <Label>{required ? <RequiredLabel>{label}</RequiredLabel> : label}</Label>
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => set(e.target.files?.[0] ?? null)}
                            className="cursor-pointer"
                          />
                          {file && <span className="text-sm text-muted-foreground truncate">{file.name}</span>}
                        </div>
                        {existingUrl && !file && (
                          <a
                            href={resolveFileUrl(existingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Already uploaded — View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Products/Services */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Add each product or service with Halal compliance details.</p>
              {formData.products.map((product, idx) => (
                <Card key={product.id} className="border-dashed">
                  <CardHeader className="py-4 flex flex-row items-center justify-between">
                    <span className="font-medium">Product / Service #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          products: p.products.filter((x) => x.id !== product.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label><RequiredLabel>Name</RequiredLabel></Label>
                        <Input
                          value={product.name}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, name: e.target.value } : x
                              ),
                            }))
                          }
                          placeholder="Product/Service name"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={product.category}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, category: v } : x
                              ),
                            }))
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Ingredients List</Label>
                      <Textarea
                        value={product.ingredients}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            products: p.products.map((x) =>
                              x.id === product.id ? { ...x, ingredients: e.target.value } : x
                            ),
                          }))
                        }
                        rows={2}
                        placeholder="List ingredients"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Source of Ingredients</Label>
                        <Input
                          value={product.sourceOfIngredients}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, sourceOfIngredients: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Supplier Name</Label>
                        <Input
                          value={product.supplierName}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, supplierName: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Country of Origin</Label>
                        <Input
                          value={product.countryOfOrigin}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, countryOfOrigin: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Production Method</Label>
                        <Input
                          value={product.productionMethod}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, productionMethod: e.target.value } : x
                              ),
                            }))
                          }
                          placeholder="Short description"
                        />
                      </div>
                      <div>
                        <Label>Packaging Type</Label>
                        <Input
                          value={product.packagingType}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, packagingType: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Storage Method</Label>
                        <Input
                          value={product.storageMethod}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id ? { ...x, storageMethod: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setFormData((p) => ({ ...p, products: [...p.products, emptyProduct()] }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product / Service
              </Button>
            </div>
          )}

          {/* Step 4: Declaration & Signature */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium">Mandatory declarations (all must be checked):</p>
                {[
                  { key: "declNoAlcohol", label: "No alcohol or pork used", checked: formData.declNoAlcohol },
                  { key: "declNoProhibited", label: "No prohibited ingredients used", checked: formData.declNoProhibited },
                  { key: "declMajlisCompliance", label: "Full compliance with Majlis standards", checked: formData.declMajlisCompliance },
                  { key: "declDataAccurate", label: "All submitted data is accurate", checked: formData.declDataAccurate },
                ].map(({ key, label, checked }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={checked}
                      onCheckedChange={(v) =>
                        setFormData((p) => ({ ...p, [key]: !!v }))
                      }
                    />
                    <label htmlFor={key} className="text-sm font-medium leading-none cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              <div>
                <Label><RequiredLabel>Digital Signature</RequiredLabel></Label>
                <Input
                  value={formData.signatureData}
                  onChange={(e) => setFormData((p) => ({ ...p, signatureData: e.target.value }))}
                  placeholder="Type your full name to sign"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  By typing your name, you agree to the declarations above.
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>Date: {new Date().toLocaleDateString()} (auto)</p>
                <p>IP: (recorded at submit)</p>
                <p>User: (your account)</p>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Owner Information */}
              <div className="rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Owner Information
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Full Name:</span> <span className="font-medium">{formData.fullName || "—"}</span></div>
                  <div><span className="text-muted-foreground">National ID / Passport:</span> <span className="font-medium">{formData.nationalId || "—"}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{formData.gender || "—"}</span></div>
                  <div><span className="text-muted-foreground">Date of Birth:</span> <span className="font-medium">{formData.dateOfBirth || "—"}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{formData.phoneNumber || "—"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{formData.emailAddress || "—"}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{formData.role || "—"}</span></div>
                  {formData.homeAddress && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Home Address:</span> <span className="font-medium">{formData.homeAddress}</span></div>
                  )}
                </div>
              </div>

              {/* Business Details */}
              <div className="rounded-lg border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/20 dark:bg-blue-950/20 p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Business Details
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Business Name:</span> <span className="font-medium">{formData.businessName || "—"}</span></div>
                  <div><span className="text-muted-foreground">Brand / Trade Name:</span> <span className="font-medium">{formData.brandName || "—"}</span></div>
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{formData.category?.replace("_", " ") || "—"}</span></div>
                  <div><span className="text-muted-foreground">Year Established:</span> <span className="font-medium">{formData.yearEstablished || "—"}</span></div>
                  <div><span className="text-muted-foreground">Business Type:</span> <span className="font-medium">{formData.businessType || "—"}</span></div>
                  <div><span className="text-muted-foreground">TIN Number:</span> <span className="font-medium">{formData.tinNumber || "—"}</span></div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/20 dark:bg-violet-950/20 p-4">
                <h4 className="font-semibold text-violet-800 dark:text-violet-200 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Region:</span> <span className="font-medium">{selectedRegion?.name || "—"}</span></div>
                  <div><span className="text-muted-foreground">Zone:</span> <span className="font-medium">{selectedZone?.name || "—"}</span></div>
                  <div><span className="text-muted-foreground">Woreda:</span> <span className="font-medium">{selectedZone?.woredas?.find((w) => w.id === formData.woredaId)?.name || "—"}</span></div>
                  {formData.address && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Kebele / Area:</span> <span className="font-medium">{formData.address}</span></div>
                  )}
                  {(formData.latitude || formData.longitude) && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Coordinates:</span> <span className="font-medium font-mono">{formData.latitude}, {formData.longitude}</span></div>
                  )}
                </div>
                {hasValidCoords && (
                  <div className="mt-3">
                    <GoogleMapEmbed latitude={lat} longitude={lng} title="Business location" height={180} zoom={14} />
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/20 dark:bg-amber-950/20 p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Uploaded Documents
                </h4>
                <ul className="space-y-2 text-sm">
                  {formData.businessLicenseFile && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Business License: {formData.businessLicenseFile.name}</li>}
                  {formData.registrationCertFile && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Registration Certificate: {formData.registrationCertFile.name}</li>}
                  {formData.tinCertFile && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> TIN Certificate: {formData.tinCertFile.name}</li>}
                  {formData.ownerIdFile && <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Owner ID/Passport: {formData.ownerIdFile.name}</li>}
                  {!formData.businessLicenseFile && !formData.registrationCertFile && !formData.tinCertFile && !formData.ownerIdFile && (
                    <li className="text-muted-foreground">No documents uploaded</li>
                  )}
                </ul>
              </div>

              {/* Products / Services */}
              {formData.products.some((p) => p.name.trim()) && (
                <div className="rounded-lg border border-teal-200/50 dark:border-teal-800/30 bg-teal-50/20 dark:bg-teal-950/20 p-4">
                  <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Products / Services
                  </h4>
                  <div className="space-y-4">
                    {formData.products.filter((p) => p.name.trim()).map((product, idx) => (
                      <div key={product.id} className="rounded-md border bg-background/50 p-3 text-sm">
                        <p className="font-medium mb-2">#{idx + 1} {product.name}</p>
                        <div className="grid gap-1 sm:grid-cols-2 text-muted-foreground">
                          {product.category && <span>Category: {product.category.replace("_", " ")}</span>}
                          {product.ingredients && <span className="sm:col-span-2">Ingredients: {product.ingredients}</span>}
                          {product.sourceOfIngredients && <span>Source: {product.sourceOfIngredients}</span>}
                          {product.supplierName && <span>Supplier: {product.supplierName}</span>}
                          {product.countryOfOrigin && <span>Origin: {product.countryOfOrigin}</span>}
                          {product.productionMethod && <span>Method: {product.productionMethod}</span>}
                          {product.packagingType && <span>Packaging: {product.packagingType}</span>}
                          {product.storageMethod && <span>Storage: {product.storageMethod}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declaration & Signature */}
              <div className="rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                  <PenLine className="h-4 w-4" /> Declaration & Signature
                </h4>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "No alcohol or pork used", checked: formData.declNoAlcohol },
                    { label: "No prohibited ingredients used", checked: formData.declNoProhibited },
                    { label: "Full compliance with Majlis standards", checked: formData.declMajlisCompliance },
                    { label: "All submitted data is accurate", checked: formData.declDataAccurate },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <span className="h-4 w-4 rounded-full border-2 shrink-0" />}
                      <span className={item.checked ? "" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-sm">
                  <p><span className="text-muted-foreground">Signed by:</span> <span className="font-medium">{formData.signatureData || "—"}</span></p>
                  <p className="text-muted-foreground mt-1">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={currentStep === 4 && !canProceed()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Submitting..." : isEdit ? "Update Business" : "Submit Registration"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Draft is saved automatically. You can close and resume later.
      </p>
    </div>
  );
}
