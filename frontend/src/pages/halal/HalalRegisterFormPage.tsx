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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Factory,
} from "lucide-react";
import { halalApi, type HalalBusiness, type HalalBusinessCategory } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GoogleMapEmbed from "@/components/institutions/GoogleMapEmbed";
import OromiaLocationPicker from "@/components/location/OromiaLocationPicker";
import { resolveOromiaLocationIds } from "@/services/oromia-location";
import { OROMIA_REGION_NAME } from "@/constants/oromia-zones-districts";
import { resolveFileUrl } from "@/config/api";
import { randomUUID } from "@/utils/uuid";

const DRAFT_KEY = "halal-registration-draft";

const FIELD_LABELS: Record<string, string> = {
  name: "Business name",
  contactName: "Full name",
  contactEmail: "Email address",
  contactPhone: "Phone number",
  ownersManagers: "Owners / managers",
  category: "Business category",
  categoryOther: "Business category (other)",
  tinNumber: "TIN number",
  declarationSignature: "Digital signature",
  address: "Address",
  regionId: "Region",
  zoneId: "Zone",
  woredaId: "Woreda",
  oromiaZone: "Zone",
  oromiaDistrict: "District / Woreda",
  kebeleName: "Kebele",
  businessId: "Business",
  productList: "Products",
  productionSystem: "Production system",
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
  { id: 4, title: "Production System", icon: Factory, color: "sky" },
  { id: 5, title: "Declaration & Signature", icon: PenLine, color: "amber" },
  { id: 6, title: "Review & Submit", icon: CheckCircle2, color: "teal" },
];

const STEP_COLORS: Record<string, { active: string; completed: string; line: string }> = {
  emerald: { active: "bg-emerald-600 text-white shadow-lg ring-emerald-400", completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800/50", line: "bg-emerald-500 dark:bg-emerald-500/80" },
  blue: { active: "bg-blue-600 text-white shadow-lg ring-blue-400", completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50", line: "bg-blue-500 dark:bg-blue-500/80" },
  violet: { active: "bg-violet-600 text-white shadow-lg ring-violet-400", completed: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-800/50", line: "bg-violet-500 dark:bg-violet-500/80" },
  sky: { active: "bg-sky-600 text-white shadow-lg ring-sky-400", completed: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-800/50", line: "bg-sky-500 dark:bg-sky-500/80" },
  amber: { active: "bg-amber-600 text-white shadow-lg ring-amber-400", completed: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50", line: "bg-amber-500 dark:bg-amber-500/80" },
  teal: { active: "bg-teal-600 text-white shadow-lg ring-teal-400", completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-800/50", line: "bg-teal-500 dark:bg-teal-500/80" },
};

const CATEGORIES: HalalBusinessCategory[] = [
  "SLAUGHTERHOUSE",
  "FOOD",
  "DRINKS",
  "COSMETICS",
  "MEDICINE",
  "RESTAURANT",
  "FACTORY",
  "OTHER",
];

const BUSINESS_TYPES = ["Private", "PLC", "Cooperative", "Branch"];
const BUSINESS_TYPE_OTHER_LABEL = "Other";
const BUSINESS_TYPE_OPTIONS = [...BUSINESS_TYPES, BUSINESS_TYPE_OTHER_LABEL];

function isPresetBusinessType(value: string): boolean {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

function splitBusinessTypeFromSaved(raw: string | null | undefined): { select: string; other: string } {
  const t = (raw || "").trim();
  if (!t) return { select: "", other: "" };
  if (isPresetBusinessType(t)) return { select: t, other: "" };
  return { select: BUSINESS_TYPE_OTHER_LABEL, other: t };
}

function formatBusinessCategoryLine(cat: HalalBusinessCategory, other: string): string {
  if (cat === "OTHER") return other.trim() ? `Other (${other.trim()})` : "Other";
  return cat.replace(/_/g, " ");
}

function parsePositiveAreaSqKm(s: string): number | null {
  const t = s.replace(/,/g, ".").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parsePositiveCount(s: string): number | null {
  const t = s.trim();
  if (!t || !/^\d+$/.test(t)) return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function isProductionSystemStepComplete(fd: FormData): boolean {
  const total = parsePositiveAreaSqKm(fd.productionTotalCompanyAreaSqKm);
  const prod = parsePositiveAreaSqKm(fd.productionProductionAreaSqKm);
  const lines = parsePositiveCount(fd.productionNumLines);
  const shifts = parsePositiveCount(fd.productionNumShifts);
  const employees = parsePositiveCount(fd.productionNumEmployees);
  if (total == null || prod == null || lines == null || shifts == null || employees == null) return false;
  if (prod > total) return false;
  return true;
}

function buildProductionSystemPayload(fd: FormData) {
  const total = parsePositiveAreaSqKm(fd.productionTotalCompanyAreaSqKm)!;
  const prod = parsePositiveAreaSqKm(fd.productionProductionAreaSqKm)!;
  const lines = parsePositiveCount(fd.productionNumLines)!;
  const shifts = parsePositiveCount(fd.productionNumShifts)!;
  const employees = parsePositiveCount(fd.productionNumEmployees)!;
  return {
    totalCompanyAreaSqKm: total,
    productionAreaSqKm: prod,
    numProductionLines: lines,
    numShifts: shifts,
    numEmployees: employees,
  };
}

const GENDERS = ["Male", "Female", "Other"];
const OWNER_ROLES = ["Owner", "Manager", "Representative"];

type ProductServiceCategory =
  | "MEAT"
  | "FOOD"
  | "HONEY"
  | "BISCUIT"
  | "COSMETICS"
  | "DRINK"
  | "MEDICINE"
  | "RESTAURANT"
  | "OTHER";

const PRODUCT_SERVICE_CATEGORIES: { value: ProductServiceCategory; label: string }[] = [
  { value: "MEAT", label: "Meat" },
  { value: "FOOD", label: "Food" },
  { value: "HONEY", label: "Honey" },
  { value: "BISCUIT", label: "Biscuit" },
  { value: "COSMETICS", label: "Cosmetics" },
  { value: "DRINK", label: "Drink" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "OTHER", label: "Other" },
];

const PRODUCT_NAME_OPTIONS: Record<ProductServiceCategory, string[]> = {
  MEAT: ["Goat Meat", "Sheep Meat", "Ox Meat", "Camel Meat", "Cow Meat", "Other"],
  FOOD: ["Grains", "Flour", "Cooking Oil", "Spices", "Dried Foods", "Other"],
  HONEY: ["Raw Honey", "Filtered Honey", "Creamed Honey", "Organic Honey", "Other"],
  BISCUIT: ["Sweet Biscuits", "Savory Crackers", "Cookies", "Wafers", "Other"],
  COSMETICS: ["Skincare", "Hair Care", "Makeup", "Fragrance", "Other"],
  DRINK: ["Juice", "Bottled Water", "Soft Drink", "Traditional Beverage", "Other"],
  MEDICINE: ["Tablets", "Capsules", "Syrup", "Herbal / Natural", "Other"],
  RESTAURANT: ["Dine-in Menu", "Takeaway", "Catering", "Street Food Style", "Other"],
  OTHER: [],
};

/** Stored on business `productList[].description` as JSON (v2 legacy, v3 current). */
interface ProductPayloadV2 {
  v: 2;
  productCategory: ProductServiceCategory;
  productNames: string[];
  productNamesOther: string;
  slaughterMethod: "Manual" | "Automatic";
  storageMethod: "Chilled" | "Frozen";
  anyIngredients: boolean;
  ingredientDescription: string;
  ingredientCertUrl: string;
  packaging: boolean;
  packagingDescription: string;
  packagingCertUrl: string;
}

interface ProductPayloadV3 {
  v: 3;
  productCategory: ProductServiceCategory;
  productNames: string[];
  productNamesOther: string;
  slaughterMethod: "Manual" | "Automatic";
  storageMethod: "Chilled" | "Frozen";
  anyIngredients: boolean;
  ingredients: { description: string; certUrl: string }[];
  packaging: boolean;
  packagingItems: { description: string; certUrl: string }[];
}

/** One ingredient row or one packaging type row (description + optional certificate). */
interface ProductDocEntry {
  id: string;
  description: string;
  certFile: File | null;
  certUrl: string;
}

const emptyDocEntry = (): ProductDocEntry => ({
  id: randomUUID(),
  description: "",
  certFile: null,
  certUrl: "",
});

function normalizeDocEntryArray(
  raw: unknown,
  legacyDesc: string | undefined,
  legacyUrl: string | undefined
): ProductDocEntry[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((e) => {
      const o = e as Record<string, unknown>;
      return {
        id: typeof o?.id === "string" && o.id ? o.id : randomUUID(),
        description: typeof o?.description === "string" ? o.description : "",
        certFile: null,
        certUrl: typeof o?.certUrl === "string" ? o.certUrl : "",
      };
    });
  }
  const ld = (legacyDesc ?? "").trim();
  const lu = (legacyUrl ?? "").trim();
  if (ld || lu) {
    return [{ id: randomUUID(), description: ld, certFile: null, certUrl: lu }];
  }
  return [];
}

interface ProductItem {
  id: string;
  productCategory: ProductServiceCategory | "";
  productNames: string[];
  productNamesOther: string;
  slaughterMethod: "Manual" | "Automatic" | "";
  storageMethod: "Chilled" | "Frozen" | "";
  anyIngredients: "yes" | "no" | "";
  ingredientEntries: ProductDocEntry[];
  packaging: "yes" | "no" | "";
  packagingEntries: ProductDocEntry[];
}

/** Draft / API may still carry flat v2 fields; `normalizeProductItem` merges them into entry arrays. */
type ProductItemDraft = Partial<ProductItem> & {
  id?: string;
  ingredientDescription?: string;
  ingredientCertUrl?: string;
  packagingDescription?: string;
  packagingCertUrl?: string;
};

function formatProductLineForReview(p: ProductItem): string {
  const cat =
    PRODUCT_SERVICE_CATEGORIES.find((c) => c.value === p.productCategory)?.label ||
    (p.productCategory ? String(p.productCategory) : "—");
  const names =
    p.productCategory === "OTHER" ? (p.productNamesOther ?? "").trim() : (p.productNames ?? []).join(", ");
  return `${cat}: ${names || "—"}`;
}

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <>
    {children} <span className="text-red-500">*</span>
  </>
);

const emptyProduct = (): ProductItem => ({
  id: randomUUID(),
  productCategory: "",
  productNames: [],
  productNamesOther: "",
  slaughterMethod: "",
  storageMethod: "",
  anyIngredients: "",
  ingredientEntries: [],
  packaging: "",
  packagingEntries: [],
});

function normalizeProductItem(pr: ProductItemDraft): ProductItem {
  const b = emptyProduct();
  const draft = pr as ProductItemDraft;
  return {
    ...b,
    id: draft.id || b.id,
    productCategory: (draft.productCategory ?? b.productCategory) as ProductItem["productCategory"],
    productNames: Array.isArray(draft.productNames) ? draft.productNames : b.productNames,
    productNamesOther: typeof draft.productNamesOther === "string" ? draft.productNamesOther : b.productNamesOther,
    slaughterMethod:
      draft.slaughterMethod === "Manual" || draft.slaughterMethod === "Automatic"
        ? draft.slaughterMethod
        : b.slaughterMethod,
    storageMethod:
      draft.storageMethod === "Chilled" || draft.storageMethod === "Frozen" ? draft.storageMethod : b.storageMethod,
    anyIngredients:
      draft.anyIngredients === "yes" || draft.anyIngredients === "no" ? draft.anyIngredients : b.anyIngredients,
    ingredientEntries: normalizeDocEntryArray(
      draft.ingredientEntries,
      typeof draft.ingredientDescription === "string" ? draft.ingredientDescription : undefined,
      typeof draft.ingredientCertUrl === "string" ? draft.ingredientCertUrl : undefined
    ),
    packaging: draft.packaging === "yes" || draft.packaging === "no" ? draft.packaging : b.packaging,
    packagingEntries: normalizeDocEntryArray(
      draft.packagingEntries,
      typeof draft.packagingDescription === "string" ? draft.packagingDescription : undefined,
      typeof draft.packagingCertUrl === "string" ? draft.packagingCertUrl : undefined
    ),
  };
}

function isProductRowComplete(p: ProductItem): boolean {
  if (!p.productCategory) return false;
  if (p.productCategory === "OTHER") {
    if (!(p.productNamesOther ?? "").trim()) return false;
  } else if ((p.productNames ?? []).length === 0) return false;
  if (p.slaughterMethod !== "Manual" && p.slaughterMethod !== "Automatic") return false;
  if (p.storageMethod !== "Chilled" && p.storageMethod !== "Frozen") return false;
  if (p.anyIngredients !== "yes" && p.anyIngredients !== "no") return false;
  if (p.anyIngredients === "yes") {
    const ing = p.ingredientEntries ?? [];
    if (ing.length === 0) return false;
    for (const e of ing) {
      if (!(e.description ?? "").trim()) return false;
      if (!e.certFile && !(e.certUrl ?? "").trim()) return false;
    }
  }
  if (p.packaging !== "yes" && p.packaging !== "no") return false;
  if (p.packaging === "yes") {
    const pkg = p.packagingEntries ?? [];
    if (pkg.length === 0) return false;
    for (const e of pkg) {
      if (!(e.description ?? "").trim()) return false;
      if (!e.certFile && !(e.certUrl ?? "").trim()) return false;
    }
  }
  return true;
}

interface OwnerManagerEntry {
  id: string;
  fullName: string;
  nationalId: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  emailAddress: string;
  homeAddress: string;
  role: string;
  ownerIdFile: File | null;
  ownerIdUrl: string;
}

const emptyOwnerManager = (): OwnerManagerEntry => ({
  id: randomUUID(),
  fullName: "",
  nationalId: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
  emailAddress: "",
  homeAddress: "",
  role: "Owner",
  ownerIdFile: null,
  ownerIdUrl: "",
});

function ownerIdDocumentLabel(fullName: string, totalOwners: number): string {
  const t = fullName.trim();
  if (totalOwners <= 1) return "Owner ID/Passport";
  return `Owner ID/Passport - ${t}`;
}

function findOwnerIdDocUrl(
  docs: { name: string; url: string }[],
  fullName: string,
  totalOwners: number
): string {
  const primary = ownerIdDocumentLabel(fullName, totalOwners);
  const hit = docs.find((d) => d.name === primary);
  if (hit?.url) return hit.url;
  if (totalOwners <= 1) {
    return docs.find((d) => d.name === "Owner ID/Passport")?.url || "";
  }
  return "";
}

/** JSON shape in `productList[].description` when editing an existing business. */
type StoredProductJson = {
  v?: 2 | 3;
  productCategory?: ProductServiceCategory;
  productNames?: string[];
  productNamesOther?: string;
  slaughterMethod?: string;
  storageMethod?: string;
  anyIngredients?: boolean;
  packaging?: boolean;
  ingredientDescription?: string;
  ingredientCertUrl?: string;
  packagingDescription?: string;
  packagingCertUrl?: string;
  ingredients?: unknown;
  packagingItems?: unknown;
};

function parseProductFromApplication(p: { name: string; description?: string }): ProductItem {
  const raw = (p.description || "").trim();
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as StoredProductJson;
      if (j?.productCategory && (j.v === 2 || j.v === 3)) {
        const partial: ProductItemDraft = {
          id: randomUUID(),
          productCategory: j.productCategory,
          productNames: Array.isArray(j.productNames) ? j.productNames : [],
          productNamesOther: typeof j.productNamesOther === "string" ? j.productNamesOther : "",
          slaughterMethod:
            j.slaughterMethod === "Manual" || j.slaughterMethod === "Automatic" ? j.slaughterMethod : "",
          storageMethod: j.storageMethod === "Chilled" || j.storageMethod === "Frozen" ? j.storageMethod : "",
          anyIngredients: j.anyIngredients === true ? "yes" : j.anyIngredients === false ? "no" : "",
          packaging: j.packaging === true ? "yes" : j.packaging === false ? "no" : "",
        };
        if (j.v === 3) {
          partial.ingredientEntries = normalizeDocEntryArray(j.ingredients, undefined, undefined);
          partial.packagingEntries = normalizeDocEntryArray(j.packagingItems, undefined, undefined);
        } else {
          partial.ingredientDescription =
            typeof j.ingredientDescription === "string" ? j.ingredientDescription : "";
          partial.ingredientCertUrl = typeof j.ingredientCertUrl === "string" ? j.ingredientCertUrl : "";
          partial.packagingDescription =
            typeof j.packagingDescription === "string" ? j.packagingDescription : "";
          partial.packagingCertUrl = typeof j.packagingCertUrl === "string" ? j.packagingCertUrl : "";
        }
        return normalizeProductItem(partial);
      }
    } catch {
      /* fall through */
    }
  }
  const parts = raw.split(" | ");
  const getVal = (prefix: string) => {
    const found = parts.find((x) => x.startsWith(prefix));
    return found ? found.slice(prefix.length).trim() : "";
  };
  const legacyCat = parts[0] || "";
  const mapped: ProductServiceCategory =
    legacyCat.includes("MEAT") || legacyCat === "FOOD_MEAT" ? "MEAT" : "FOOD";
  return normalizeProductItem({
    id: randomUUID(),
    productCategory: mapped,
    productNames: p.name ? [p.name] : [],
    productNamesOther: "",
    slaughterMethod: (getVal("Method: ") === "Automatic" ? "Automatic" : getVal("Method: ") ? "Manual" : "") as
      | "Manual"
      | "Automatic"
      | "",
    storageMethod: (getVal("Storage: ").toLowerCase().includes("frozen")
      ? "Frozen"
      : getVal("Storage: ")
        ? "Chilled"
        : "") as "Chilled" | "Frozen" | "",
    anyIngredients: "",
    packaging: "",
  });
}

interface FormData {
  // Step 1: Owners / managers (at least one)
  ownersManagers: OwnerManagerEntry[];
  // Step 2: Business
  businessName: string;
  brandName: string;
  category: HalalBusinessCategory;
  categoryOther: string;
  yearEstablished: string;
  businessType: string;
  businessTypeOther: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  regionId: string;
  zoneId: string;
  woredaId: string;
  /** Oromia picker names — resolved to regionId/zoneId/woredaId on submit */
  oromiaZone: string;
  oromiaDistrict: string;
  kebeleName: string;
  address: string;
  latitude: string;
  longitude: string;
  tinNumber: string;
  // Documents (file URLs after upload)
  businessLicenseFile: File | null;
  businessLicenseUrl: string;
  healthCertFile: File | null;
  healthCertUrl: string;
  iso22000CertFile: File | null;
  iso22000CertUrl: string;
  tinCertFile: File | null;
  tinCertUrl: string;
  // Step 3: Products
  products: ProductItem[];
  // Step 4: Production system (areas in sq km; counts)
  productionTotalCompanyAreaSqKm: string;
  productionProductionAreaSqKm: string;
  productionNumLines: string;
  productionNumShifts: string;
  productionNumEmployees: string;
  // Step 5: Declaration
  declNoAlcohol: boolean;
  declNoProhibited: boolean;
  declMajlisCompliance: boolean;
  declDataAccurate: boolean;
  signatureData: string;
}

const initialFormData: FormData = {
  ownersManagers: [emptyOwnerManager()],
  businessName: "",
  brandName: "",
  category: "SLAUGHTERHOUSE",
  categoryOther: "",
  yearEstablished: "",
  businessType: "",
  businessTypeOther: "",
  businessPhone: "",
  businessEmail: "",
  businessWebsite: "",
  regionId: "",
  zoneId: "",
  woredaId: "",
  oromiaZone: "",
  oromiaDistrict: "",
  kebeleName: "",
  address: "",
  latitude: "",
  longitude: "",
  tinNumber: "",
  businessLicenseFile: null,
  businessLicenseUrl: "",
  healthCertFile: null,
  healthCertUrl: "",
  iso22000CertFile: null,
  iso22000CertUrl: "",
  tinCertFile: null,
  tinCertUrl: "",
  products: [emptyProduct()],
  productionTotalCompanyAreaSqKm: "",
  productionProductionAreaSqKm: "",
  productionNumLines: "",
  productionNumShifts: "",
  productionNumEmployees: "",
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
    delete parsed.healthCertFile;
    delete parsed.iso22000CertFile;
    delete parsed.tinCertFile;
    if (Array.isArray(parsed.ownersManagers)) {
      parsed.ownersManagers = parsed.ownersManagers.map((o: OwnerManagerEntry) => ({
        ...o,
        ownerIdFile: null,
        id: o.id || randomUUID(),
      }));
    } else if (parsed.fullName != null || parsed.emailAddress != null) {
      parsed.ownersManagers = [
        {
          id: randomUUID(),
          fullName: parsed.fullName || "",
          nationalId: parsed.nationalId || "",
          gender: parsed.gender || "",
          dateOfBirth: parsed.dateOfBirth || "",
          phoneNumber: parsed.phoneNumber || "",
          emailAddress: parsed.emailAddress || "",
          homeAddress: parsed.homeAddress || "",
          role: parsed.role || "Owner",
          ownerIdFile: null,
          ownerIdUrl: parsed.ownerIdUrl || "",
        },
      ];
      delete parsed.fullName;
      delete parsed.nationalId;
      delete parsed.gender;
      delete parsed.dateOfBirth;
      delete parsed.phoneNumber;
      delete parsed.emailAddress;
      delete parsed.homeAddress;
      delete parsed.role;
      delete parsed.ownerIdUrl;
    }
    if (Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((pr: Partial<ProductItem>) => normalizeProductItem(pr));
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(data: FormData, id: string | undefined) {
  try {
    const toSave = { ...data };
    (toSave as any).businessLicenseFile = null;
    (toSave as any).healthCertFile = null;
    (toSave as any).iso22000CertFile = null;
    (toSave as any).tinCertFile = null;
    toSave.ownersManagers = toSave.ownersManagers.map((o) => ({ ...o, ownerIdFile: null }));
    toSave.products = toSave.products.map((p) => ({
      ...p,
      ingredientEntries: (p.ingredientEntries ?? []).map((e) => ({ ...e, certFile: null })),
      packagingEntries: (p.packagingEntries ?? []).map((e) => ({ ...e, certFile: null })),
    }));
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

  useEffect(() => {
    if (isEdit && business) {
      const b = business as import("@/services/halal").HalalBusiness & {
        productList?: { name: string; description?: string }[];
        documents?: { name: string; url: string }[];
        ownersManagers?: Array<{
          fullName: string;
          email: string;
          phone: string;
          nationalId?: string;
          gender?: string;
          dateOfBirth?: string;
          homeAddress?: string;
          role?: string;
        }>;
      };
      const productList = (b.productList || []).filter((x) => x && x.name);
      const products =
        productList.length > 0
          ? productList.map((row) => normalizeProductItem(parseProductFromApplication(row)))
          : [emptyProduct()];
      const docs = (b.documents || []) as { name: string; url: string }[];
      const om = b.ownersManagers;
      const ownersManagers: OwnerManagerEntry[] =
        Array.isArray(om) && om.length > 0
          ? om.map((o) => {
              const dob =
                o.dateOfBirth && !Number.isNaN(Date.parse(o.dateOfBirth))
                  ? new Date(o.dateOfBirth).toISOString().slice(0, 10)
                  : "";
              return {
                id: randomUUID(),
                fullName: o.fullName || "",
                nationalId: o.nationalId || "",
                gender: o.gender || "",
                dateOfBirth: dob,
                phoneNumber: o.phone || "",
                emailAddress: o.email || "",
                homeAddress: o.homeAddress || "",
                role: o.role || "Owner",
                ownerIdFile: null,
                ownerIdUrl: findOwnerIdDocUrl(docs, o.fullName || "", om.length),
              };
            })
          : (() => {
              const dob = b.ownerDateOfBirth ? new Date(b.ownerDateOfBirth).toISOString().slice(0, 10) : "";
              return [
                {
                  id: randomUUID(),
                  fullName: business.contactName || "",
                  nationalId: b.ownerNationalId || "",
                  gender: b.ownerGender || "",
                  dateOfBirth: dob,
                  phoneNumber: business.contactPhone || "",
                  emailAddress: business.contactEmail || "",
                  homeAddress: b.ownerHomeAddress || "",
                  role: b.ownerRole || "Owner",
                  ownerIdFile: null,
                  ownerIdUrl: findOwnerIdDocUrl(docs, business.contactName || "", 1),
                },
              ];
            })();
      const bt = splitBusinessTypeFromSaved(b.businessType);
      const ps = (business as HalalBusiness).productionSystem;
      const productionFields =
        ps &&
        typeof ps.totalCompanyAreaSqKm === "number" &&
        typeof ps.productionAreaSqKm === "number" &&
        typeof ps.numProductionLines === "number" &&
        typeof ps.numShifts === "number" &&
        typeof ps.numEmployees === "number"
          ? {
              productionTotalCompanyAreaSqKm: String(ps.totalCompanyAreaSqKm),
              productionProductionAreaSqKm: String(ps.productionAreaSqKm),
              productionNumLines: String(ps.numProductionLines),
              productionNumShifts: String(ps.numShifts),
              productionNumEmployees: String(ps.numEmployees),
            }
          : {};
      setFormData((p) => ({
        ...p,
        ownersManagers,
        businessName: business.name,
        brandName: b.brandName || "",
        category: business.category,
        categoryOther: b.categoryOther ?? "",
        yearEstablished: b.yearEstablished?.toString() || "",
        businessType: bt.select,
        businessTypeOther: bt.other,
        businessPhone: b.businessPhone || "",
        businessEmail: b.businessEmail || "",
        businessWebsite: b.businessWebsite || "",
        tinNumber: b.tinNumber || "",
        regionId: business.regionId || "",
        zoneId: business.zoneId || "",
        woredaId: business.woredaId || "",
        oromiaZone: business.zone?.name || "",
        oromiaDistrict: business.woreda?.name || "",
        kebeleName: business.kebeleName || "",
        address: business.address || "",
        latitude: business.latitude?.toString() || "",
        longitude: business.longitude?.toString() || "",
        businessLicenseUrl: b.licenseUrl || "",
        healthCertUrl: docs.find((d) => d.name === "Health Certificate")?.url || "",
        iso22000CertUrl: docs.find((d) => d.name === "ISO 22000 Certificate")?.url || "",
        tinCertUrl: docs.find((d) => d.name === "TIN Certificate")?.url || "",
        products,
        ...productionFields,
        signatureData: b.declarationSignature || "",
      }));
    } else if (!isEdit) {
      const draft = loadDraft(id);
      if (draft) {
        setFormData((p) => ({
          ...p,
          ...draft,
          products: (draft.products || p.products).map((x) => normalizeProductItem(x as Partial<ProductItem>)),
        }));
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
    if (!isProductionSystemStepComplete(formData)) {
      toast.error("Please complete the Production system step with valid numbers.");
      return;
    }
    if (!formData.oromiaZone.trim() || !formData.oromiaDistrict.trim()) {
      toast.error("Please select zone and district");
      return;
    }

    let regionId = formData.regionId || undefined;
    let zoneId = formData.zoneId || undefined;
    let woredaId = formData.woredaId || undefined;
    try {
      const resolved = await resolveOromiaLocationIds(
        formData.oromiaZone,
        formData.oromiaDistrict,
        "institutions"
      );
      regionId = resolved.regionId;
      zoneId = resolved.zoneId;
      woredaId = resolved.woredaId;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to resolve location");
      return;
    }

    const productionSystem = buildProductionSystemPayload(formData);
    const lat = formData.latitude ? parseFloat(formData.latitude) : undefined;
    const lng = formData.longitude ? parseFloat(formData.longitude) : undefined;
    const yearEst = formData.yearEstablished ? parseInt(formData.yearEstablished, 10) : undefined;
    const primary = formData.ownersManagers[0];
    const ownersPayload = formData.ownersManagers.map((o) => ({
      fullName: o.fullName.trim(),
      email: o.emailAddress.trim(),
      phone: o.phoneNumber.trim(),
      nationalId: o.nationalId.trim() || undefined,
      gender: o.gender || undefined,
      dateOfBirth: o.dateOfBirth || undefined,
      homeAddress: o.homeAddress.trim() || undefined,
      role: o.role || undefined,
    }));
    const businessPayload = {
      name: formData.businessName,
      category: formData.category,
      categoryOther: formData.category === "OTHER" ? formData.categoryOther.trim() || undefined : undefined,
      contactName: primary?.fullName.trim(),
      contactEmail: primary?.emailAddress.trim(),
      contactPhone: primary?.phoneNumber.trim(),
      ownersManagers: ownersPayload,
      regionId,
      zoneId,
      woredaId,
      kebeleName: formData.kebeleName || undefined,
      address: formData.address || undefined,
      latitude: lat,
      longitude: lng,
      ownerNationalId: primary?.nationalId.trim() || undefined,
      ownerGender: primary?.gender || undefined,
      ownerDateOfBirth: primary?.dateOfBirth || undefined,
      ownerHomeAddress: primary?.homeAddress.trim() || undefined,
      ownerRole: primary?.role || undefined,
      brandName: formData.brandName || undefined,
      yearEstablished: yearEst,
      businessType:
        formData.businessType === BUSINESS_TYPE_OTHER_LABEL
          ? formData.businessTypeOther.trim() || undefined
          : formData.businessType.trim() || undefined,
      tinNumber: formData.tinNumber || undefined,
      businessPhone: formData.businessPhone.trim() || undefined,
      businessEmail: formData.businessEmail.trim() || undefined,
      businessWebsite: formData.businessWebsite.trim() || undefined,
      productionSystem,
      declarationSignature: formData.signatureData || undefined,
      declarationChecklist:
        formData.declNoAlcohol && formData.declNoProhibited && formData.declMajlisCompliance && formData.declDataAccurate
          ? {
              noAlcohol: formData.declNoAlcohol,
              noProhibited: formData.declNoProhibited,
              majlisCompliance: formData.declMajlisCompliance,
              dataAccurate: formData.declDataAccurate,
            }
          : undefined,
    };

    const buildProductListWithUploads = async (): Promise<{ name: string; description: string }[]> => {
      const rows: { name: string; description: string }[] = [];
      for (const p of formData.products) {
        if (!isProductRowComplete(p)) continue;
        const ingredients: { description: string; certUrl: string }[] = [];
        if (p.anyIngredients === "yes") {
          for (const e of p.ingredientEntries) {
            let certUrl = (e.certUrl ?? "").trim();
            if (e.certFile) {
              const r = await halalApi.businesses.uploadDocument(e.certFile);
              certUrl = r.url;
            }
            ingredients.push({ description: (e.description ?? "").trim(), certUrl });
          }
        }
        const packagingItems: { description: string; certUrl: string }[] = [];
        if (p.packaging === "yes") {
          for (const e of p.packagingEntries) {
            let certUrl = (e.certUrl ?? "").trim();
            if (e.certFile) {
              const r = await halalApi.businesses.uploadDocument(e.certFile);
              certUrl = r.url;
            }
            packagingItems.push({ description: (e.description ?? "").trim(), certUrl });
          }
        }
        const catLabel =
          PRODUCT_SERVICE_CATEGORIES.find((c) => c.value === p.productCategory)?.label ?? p.productCategory;
        const nameLine =
          p.productCategory === "OTHER"
            ? (p.productNamesOther ?? "").trim()
            : (p.productNames ?? []).join(", ");
        const payload: ProductPayloadV3 = {
          v: 3,
          productCategory: p.productCategory as ProductServiceCategory,
          productNames: p.productNames ?? [],
          productNamesOther: (p.productNamesOther ?? "").trim(),
          slaughterMethod: p.slaughterMethod as "Manual" | "Automatic",
          storageMethod: p.storageMethod as "Chilled" | "Frozen",
          anyIngredients: p.anyIngredients === "yes",
          ingredients,
          packaging: p.packaging === "yes",
          packagingItems,
        };
        rows.push({
          name: `${catLabel}: ${nameLine}`.slice(0, 400),
          description: JSON.stringify(payload),
        });
      }
      return rows;
    };

    const buildDocuments = async (): Promise<{ name: string; url: string }[]> => {
      const docs: { name: string; url: string }[] = [];
      if (formData.healthCertFile) {
        const r = await halalApi.businesses.uploadDocument(formData.healthCertFile);
        docs.push({ name: "Health Certificate", url: r.url });
      } else if (formData.healthCertUrl) {
        docs.push({ name: "Health Certificate", url: formData.healthCertUrl });
      }
      if (formData.iso22000CertFile) {
        const r = await halalApi.businesses.uploadDocument(formData.iso22000CertFile);
        docs.push({ name: "ISO 22000 Certificate", url: r.url });
      } else if (formData.iso22000CertUrl) {
        docs.push({ name: "ISO 22000 Certificate", url: formData.iso22000CertUrl });
      }
      if (formData.tinCertFile) {
        const r = await halalApi.businesses.uploadDocument(formData.tinCertFile);
        docs.push({ name: "TIN Certificate", url: r.url });
      } else if (formData.tinCertUrl) {
        docs.push({ name: "TIN Certificate", url: formData.tinCertUrl });
      }
      const nOwners = formData.ownersManagers.length;
      for (const o of formData.ownersManagers) {
        const label = ownerIdDocumentLabel(o.fullName, nOwners);
        if (o.ownerIdFile) {
          const r = await halalApi.businesses.uploadDocument(o.ownerIdFile);
          docs.push({ name: label, url: r.url });
        } else if (o.ownerIdUrl) {
          docs.push({ name: label, url: o.ownerIdUrl });
        }
      }
      return docs;
    };

    if (isEdit) {
      setIsSubmittingForm(true);
      try {
        const documents = await buildDocuments();
        const productList = await buildProductListWithUploads();
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
      const productList = await buildProductListWithUploads();
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
      return formData.ownersManagers.every(
        (o) => o.fullName.trim() && o.phoneNumber.trim() && o.emailAddress.trim()
      );
    }
    if (currentStep === 2) {
      const hasLicense = !!formData.businessLicenseFile || !!formData.businessLicenseUrl;
      const hasHealthCert = !!formData.healthCertFile || !!formData.healthCertUrl;
      const hasIso22000 = !!formData.iso22000CertFile || !!formData.iso22000CertUrl;
      const hasTinCert = !!formData.tinCertFile || !!formData.tinCertUrl;
      const ownersHaveId = formData.ownersManagers.every((o) => !!o.ownerIdFile || !!o.ownerIdUrl);
      const categoryOtherOk = formData.category !== "OTHER" || formData.categoryOther.trim().length > 0;
      const businessTypeOtherOk =
        formData.businessType !== BUSINESS_TYPE_OTHER_LABEL ||
        formData.businessTypeOther.trim().length > 0;
      return (
        formData.businessName.trim() &&
        formData.category &&
        categoryOtherOk &&
        businessTypeOtherOk &&
        formData.tinNumber.trim() &&
        formData.oromiaZone.trim() &&
        formData.oromiaDistrict.trim() &&
        hasLicense &&
        hasHealthCert &&
        hasIso22000 &&
        hasTinCert &&
        ownersHaveId
      );
    }
    if (currentStep === 3) {
      return (
        formData.products.length > 0 &&
        formData.products.every((p) => isProductRowComplete(p))
      );
    }
    if (currentStep === 4) {
      return isProductionSystemStepComplete(formData);
    }
    if (currentStep === 5) {
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
              Step {currentStep} of 6 — {STEPS[currentStep - 1].title}
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
            {currentStep === 1 && ""}
            {currentStep === 2 && "Verify business legality and location"}
            {currentStep === 3 && "Define each product line: category, names, slaughter & storage, ingredients, and packaging"}
            {currentStep === 4 && "Facility footprint, production footprint, and workforce"}
            {currentStep === 5 && "Legal and religious accountability"}
            {currentStep === 6 && "Review all information before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Add every owner or authorized manager. The first person is the primary contact for this registration.
              </p>
              {formData.ownersManagers.map((owner, idx) => (
                <Card key={owner.id} className="border-dashed border-emerald-200/60 dark:border-emerald-800/40">
                  <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                      Owner / manager {idx + 1}
                      {idx === 0 ? <span className="text-muted-foreground font-normal text-sm"> (primary contact)</span> : null}
                    </span>
                    {formData.ownersManagers.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive shrink-0"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            ownersManagers: p.ownersManagers.filter((x) => x.id !== owner.id),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label><RequiredLabel>Full Name</RequiredLabel></Label>
                        <Input
                          value={owner.fullName}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, fullName: e.target.value } : x
                              ),
                            }))
                          }
                          placeholder="Legal name"
                          required
                        />
                      </div>
                      <div>
                        <Label>National ID(FAN) / Passport Number</Label>
                        <Input
                          value={owner.nationalId}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, nationalId: e.target.value } : x
                              ),
                            }))
                          }
                          placeholder="ID or passport"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={owner.gender}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, gender: v } : x
                              ),
                            }))
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={owner.dateOfBirth}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, dateOfBirth: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label><RequiredLabel>Role</RequiredLabel></Label>
                        <Select
                          value={owner.role}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, role: v } : x
                              ),
                            }))
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OWNER_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label><RequiredLabel>Phone Number</RequiredLabel></Label>
                        <Input
                          value={owner.phoneNumber}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, phoneNumber: e.target.value } : x
                              ),
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label><RequiredLabel>Email Address</RequiredLabel></Label>
                        <Input
                          type="email"
                          value={owner.emailAddress}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              ownersManagers: p.ownersManagers.map((x) =>
                                x.id === owner.id ? { ...x, emailAddress: e.target.value } : x
                              ),
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Home Address</Label>
                      <Textarea
                        value={owner.homeAddress}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            ownersManagers: p.ownersManagers.map((x) =>
                              x.id === owner.id ? { ...x, homeAddress: e.target.value } : x
                            ),
                          }))
                        }
                        rows={2}
                        placeholder="Full home address"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    ownersManagers: [...p.ownersManagers, emptyOwnerManager()],
                  }))
                }
              >
                <Plus className="h-4 w-4 mr-2 bg-emerald-500 text-white" />
                Add owner or manager
              </Button>
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
                    <Label>Brand / Trade Mark</Label>
                    <Input
                      value={formData.brandName}
                      onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label><RequiredLabel>Business Category</RequiredLabel></Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          category: v as HalalBusinessCategory,
                          ...(v !== "OTHER" ? { categoryOther: "" } : {}),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c === "OTHER" ? "Other" : c.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.category === "OTHER" ? (
                    <div className="sm:col-span-2">
                      <Label>
                        <RequiredLabel>Describe business category</RequiredLabel>
                      </Label>
                      <Input
                        value={formData.categoryOther}
                        onChange={(e) => setFormData((p) => ({ ...p, categoryOther: e.target.value }))}
                        placeholder="e.g. Logistics, Catering, Mixed retail…"
                      />
                    </div>
                  ) : null}
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
                      value={formData.businessType || undefined}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          businessType: v,
                          ...(v !== BUSINESS_TYPE_OTHER_LABEL ? { businessTypeOther: "" } : {}),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPE_OPTIONS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.businessType === BUSINESS_TYPE_OTHER_LABEL ? (
                    <div className="sm:col-span-2">
                      <Label>
                        <RequiredLabel>Describe business type</RequiredLabel>
                      </Label>
                      <Input
                        value={formData.businessTypeOther}
                        onChange={(e) => setFormData((p) => ({ ...p, businessTypeOther: e.target.value }))}
                        placeholder="e.g. Partnership, Government enterprise…"
                      />
                    </div>
                  ) : null}
                  <div>
                    <Label>Business phone</Label>
                    <Input
                      value={formData.businessPhone}
                      onChange={(e) => setFormData((p) => ({ ...p, businessPhone: e.target.value }))}
                      placeholder="Main business line"
                    />
                  </div>
                  <div>
                    <Label>Business email</Label>
                    <Input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData((p) => ({ ...p, businessEmail: e.target.value }))}
                      placeholder="info@business.com"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={formData.businessWebsite}
                      onChange={(e) => setFormData((p) => ({ ...p, businessWebsite: e.target.value }))}
                      placeholder="https://example.com or www.example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
                <OromiaLocationPicker
                  required
                  value={{
                    zone: formData.oromiaZone,
                    district: formData.oromiaDistrict,
                    kebele: formData.kebeleName,
                  }}
                  onChange={(loc) =>
                    setFormData((p) => ({
                      ...p,
                      oromiaZone: loc.zone,
                      oromiaDistrict: loc.district,
                      kebeleName: loc.kebele ?? "",
                      regionId: "",
                      zoneId: "",
                      woredaId: "",
                    }))
                  }
                  showKebele
                  kebeleLabel="Kebele (optional)"
                  kebelePlaceholder="e.g. Kebele 01"
                  districtLabel="District / Woreda"
                />
                <div className="mt-4">
                  <Label>Area / street (optional)</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                    rows={2}
                    placeholder="Street, neighborhood, or other area details"
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
                      key: "healthCertFile",
                      label: "Health Certificate",
                      file: formData.healthCertFile,
                      existingUrl: formData.healthCertUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, healthCertFile: f })),
                      required: !formData.healthCertUrl,
                    },
                    {
                      key: "iso22000CertFile",
                      label: "ISO 22000 Certificate",
                      file: formData.iso22000CertFile,
                      existingUrl: formData.iso22000CertUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, iso22000CertFile: f })),
                      required: !formData.iso22000CertUrl,
                    },
                    {
                      key: "tinCertFile",
                      label: "TIN Certificate",
                      file: formData.tinCertFile,
                      existingUrl: formData.tinCertUrl,
                      set: (f: File | null) => setFormData((p) => ({ ...p, tinCertFile: f })),
                      required: !formData.tinCertUrl,
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
                  <div className="sm:col-span-2 pt-2 border-t border-dashed">
                    <p className="text-sm font-medium mb-3">Owner / manager ID or passport</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload one government-issued ID per person listed in step 1. Labels must match each person’s full name.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {formData.ownersManagers.map((owner) => {
                        const n = formData.ownersManagers.length;
                        const docLabel = ownerIdDocumentLabel(owner.fullName, n);
                        const required = !owner.ownerIdUrl;
                        return (
                          <div key={owner.id}>
                            <Label>
                              {required ? (
                                <RequiredLabel>
                                  {docLabel}
                                  {owner.fullName.trim() ? ` (${owner.fullName.trim()})` : ""}
                                </RequiredLabel>
                              ) : (
                                <>
                                  {docLabel}
                                  {owner.fullName.trim() ? ` (${owner.fullName.trim()})` : ""}
                                </>
                              )}
                            </Label>
                            <div className="mt-1 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) =>
                                    setFormData((p) => ({
                                      ...p,
                                      ownersManagers: p.ownersManagers.map((x) =>
                                        x.id === owner.id ? { ...x, ownerIdFile: e.target.files?.[0] ?? null } : x
                                      ),
                                    }))
                                  }
                                  className="cursor-pointer"
                                />
                                {owner.ownerIdFile && (
                                  <span className="text-sm text-muted-foreground truncate">{owner.ownerIdFile.name}</span>
                                )}
                              </div>
                              {owner.ownerIdUrl && !owner.ownerIdFile && (
                                <a
                                  href={resolveFileUrl(owner.ownerIdUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Already uploaded — View
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Products/Services */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {formData.products.map((product, idx) => {
                const nameOptions =
                  product.productCategory && product.productCategory !== "OTHER"
                    ? PRODUCT_NAME_OPTIONS[product.productCategory]
                    : [];
                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden border-violet-200/50 shadow-sm dark:border-violet-800/30 bg-card/80 backdrop-blur-sm"
                  >
                    <CardHeader className="py-3 px-4 sm:px-5 bg-gradient-to-r from-violet-600/10 via-transparent to-teal-600/10 border-b border-violet-100 dark:border-violet-900/40 flex flex-row items-center justify-between gap-2">
                      <span className="font-semibold text-violet-900 dark:text-violet-100 text-sm sm:text-base">
                        Product line #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive shrink-0"
                        disabled={formData.products.length <= 1}
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
                    <CardContent className="space-y-5 p-4 sm:p-5">
                      <div>
                        <Label>
                          <RequiredLabel>Product category</RequiredLabel>
                        </Label>
                        <Select
                          value={product.productCategory || undefined}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id
                                  ? {
                                      ...x,
                                      productCategory: v as ProductServiceCategory,
                                      productNames: [],
                                      productNamesOther: "",
                                    }
                                  : x
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select category…" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_SERVICE_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {product.productCategory === "OTHER" ? (
                        <div>
                          <Label>
                            <RequiredLabel>Describe products / services</RequiredLabel>
                          </Label>
                          <Textarea
                            className="mt-1.5 min-h-[88px]"
                            value={product.productNamesOther}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                products: p.products.map((x) =>
                                  x.id === product.id ? { ...x, productNamesOther: e.target.value } : x
                                ),
                              }))
                            }
                            placeholder="List what you produce or offer (e.g. mixed retail, specialty items…)"
                          />
                        </div>
                      ) : product.productCategory ? (
                        <div className="rounded-xl border border-violet-200/70 dark:border-violet-800/50 bg-muted/30 p-4 space-y-2">
                          <Label>
                            <RequiredLabel>Product name</RequiredLabel>
                          </Label>
                          <p className="text-xs text-muted-foreground">Select all that apply.</p>
                          <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1 pt-1">
                            {nameOptions.map((opt) => {
                              const checked = (product.productNames ?? []).includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                                    checked
                                      ? "border-violet-500/60 bg-violet-50 dark:bg-violet-950/40"
                                      : "border-border hover:border-violet-300/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => {
                                      const on = !!v;
                                      setFormData((p) => ({
                                        ...p,
                                        products: p.products.map((x) => {
                                          if (x.id !== product.id) return x;
                                          const set = new Set(x.productNames ?? []);
                                          if (on) set.add(opt);
                                          else set.delete(opt);
                                          return { ...x, productNames: Array.from(set) };
                                        }),
                                      }));
                                    }}
                                  />
                                  <span className="text-sm font-medium leading-none">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="rounded-lg border bg-background/60 p-3 space-y-2">
                          <Label>
                            <RequiredLabel>Slaughter method</RequiredLabel>
                          </Label>
                          <RadioGroup
                            value={product.slaughterMethod}
                            onValueChange={(v) =>
                              setFormData((p) => ({
                                ...p,
                                products: p.products.map((x) =>
                                  x.id === product.id ? { ...x, slaughterMethod: v as "Manual" | "Automatic" } : x
                                ),
                              }))
                            }
                            className="flex flex-wrap gap-4 pt-1"
                          >
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <RadioGroupItem value="Manual" id={`${product.id}-sl-man`} />
                              <span>Manual</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <RadioGroupItem value="Automatic" id={`${product.id}-sl-auto`} />
                              <span>Automatic</span>
                            </label>
                          </RadioGroup>
                        </div>
                        <div className="rounded-lg border bg-background/60 p-3 space-y-2">
                          <Label>
                            <RequiredLabel>Storage method</RequiredLabel>
                          </Label>
                          <RadioGroup
                            value={product.storageMethod}
                            onValueChange={(v) =>
                              setFormData((p) => ({
                                ...p,
                                products: p.products.map((x) =>
                                  x.id === product.id ? { ...x, storageMethod: v as "Chilled" | "Frozen" } : x
                                ),
                              }))
                            }
                            className="flex flex-wrap gap-4 pt-1"
                          >
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <RadioGroupItem value="Chilled" id={`${product.id}-st-ch`} />
                              <span>Chilled</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <RadioGroupItem value="Frozen" id={`${product.id}-st-fr`} />
                              <span>Frozen</span>
                            </label>
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-background/60 p-3 space-y-3">
                        <Label>
                          <RequiredLabel>Are any ingredients used?</RequiredLabel>
                        </Label>
                        <RadioGroup
                          value={product.anyIngredients}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id
                                  ? {
                                      ...x,
                                      anyIngredients: v as "yes" | "no",
                                      ...(v === "no"
                                        ? { ingredientEntries: [] }
                                        : {
                                            ingredientEntries:
                                              x.ingredientEntries.length > 0 ? x.ingredientEntries : [emptyDocEntry()],
                                          }),
                                    }
                                  : x
                              ),
                            }))
                          }
                          className="flex flex-wrap gap-4"
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <RadioGroupItem value="yes" id={`${product.id}-ing-y`} />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <RadioGroupItem value="no" id={`${product.id}-ing-n`} />
                            <span>No</span>
                          </label>
                        </RadioGroup>
                        {product.anyIngredients === "yes" ? (
                          <div className="space-y-4 pt-1 border-t border-dashed">
                            <div className="flex items-center justify-between gap-3">
                              <Label className="mb-0">
                                <RequiredLabel>Ingredients & certificates</RequiredLabel>
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 shrink-0 text-violet-700 hover:text-violet-800 dark:text-violet-300"
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    products: p.products.map((x) =>
                                      x.id === product.id
                                        ? { ...x, ingredientEntries: [...x.ingredientEntries, emptyDocEntry()] }
                                        : x
                                    ),
                                  }))
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add more
                              </Button>
                            </div>
                            {product.ingredientEntries.map((entry, entryIdx) => (
                              <div
                                key={entry.id}
                                className="relative rounded-lg border border-border/80 bg-background/80 p-3 pt-9 space-y-3"
                              >
                                {product.ingredientEntries.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1.5 right-1.5 h-8 w-8 text-muted-foreground hover:text-destructive"
                                    aria-label={`Remove ingredient ${entryIdx + 1}`}
                                    onClick={() =>
                                      setFormData((p) => ({
                                        ...p,
                                        products: p.products.map((x) =>
                                          x.id === product.id
                                            ? {
                                                ...x,
                                                ingredientEntries: x.ingredientEntries.filter((e) => e.id !== entry.id),
                                              }
                                            : x
                                        ),
                                      }))
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                                <p className="absolute top-2 left-3 text-xs font-medium text-muted-foreground">
                                  Entry {entryIdx + 1}
                                </p>
                                <div>
                                  <Label>
                                    <RequiredLabel>Description</RequiredLabel>
                                  </Label>
                                  <Textarea
                                    className="mt-1.5 min-h-[72px]"
                                    value={entry.description}
                                    onChange={(ev) =>
                                      setFormData((p) => ({
                                        ...p,
                                        products: p.products.map((x) =>
                                          x.id === product.id
                                            ? {
                                                ...x,
                                                ingredientEntries: x.ingredientEntries.map((row) =>
                                                  row.id === entry.id
                                                    ? { ...row, description: ev.target.value }
                                                    : row
                                                ),
                                              }
                                            : x
                                        ),
                                      }))
                                    }
                                    placeholder="Short description of ingredients and sources"
                                  />
                                </div>
                                <div>
                                  <Label>
                                    <RequiredLabel>Certificate</RequiredLabel>
                                  </Label>
                                  <div className="mt-1.5 flex flex-col gap-1">
                                    <Input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={(ev) =>
                                        setFormData((p) => ({
                                          ...p,
                                          products: p.products.map((x) =>
                                            x.id === product.id
                                              ? {
                                                  ...x,
                                                  ingredientEntries: x.ingredientEntries.map((row) =>
                                                    row.id === entry.id
                                                      ? { ...row, certFile: ev.target.files?.[0] ?? null }
                                                      : row
                                                  ),
                                                }
                                              : x
                                          ),
                                        }))
                                      }
                                      className="cursor-pointer"
                                    />
                                    {entry.certFile && (
                                      <span className="text-xs text-muted-foreground truncate">{entry.certFile.name}</span>
                                    )}
                                    {entry.certUrl && !entry.certFile && (
                                      <a
                                        href={resolveFileUrl(entry.certUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                      >
                                        Certificate on file — View
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-lg border bg-background/60 p-3 space-y-3">
                        <Label>
                          <RequiredLabel>Is packaging used?</RequiredLabel>
                        </Label>
                        <RadioGroup
                          value={product.packaging}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              products: p.products.map((x) =>
                                x.id === product.id
                                  ? {
                                      ...x,
                                      packaging: v as "yes" | "no",
                                      ...(v === "no"
                                        ? { packagingEntries: [] }
                                        : {
                                            packagingEntries:
                                              x.packagingEntries.length > 0 ? x.packagingEntries : [emptyDocEntry()],
                                          }),
                                    }
                                  : x
                              ),
                            }))
                          }
                          className="flex flex-wrap gap-4"
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <RadioGroupItem value="yes" id={`${product.id}-pkg-y`} />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <RadioGroupItem value="no" id={`${product.id}-pkg-n`} />
                            <span>No</span>
                          </label>
                        </RadioGroup>
                        {product.packaging === "yes" ? (
                          <div className="space-y-4 pt-1 border-t border-dashed">
                            <div className="flex items-center justify-between gap-3">
                              <Label className="mb-0">
                                <RequiredLabel>Packaging types & certificates</RequiredLabel>
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 shrink-0 text-violet-700 hover:text-violet-800 dark:text-violet-300"
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    products: p.products.map((x) =>
                                      x.id === product.id
                                        ? { ...x, packagingEntries: [...x.packagingEntries, emptyDocEntry()] }
                                        : x
                                    ),
                                  }))
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add more
                              </Button>
                            </div>
                            {product.packagingEntries.map((entry, entryIdx) => (
                              <div
                                key={entry.id}
                                className="relative rounded-lg border border-border/80 bg-background/80 p-3 pt-9 space-y-3"
                              >
                                {product.packagingEntries.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1.5 right-1.5 h-8 w-8 text-muted-foreground hover:text-destructive"
                                    aria-label={`Remove packaging entry ${entryIdx + 1}`}
                                    onClick={() =>
                                      setFormData((p) => ({
                                        ...p,
                                        products: p.products.map((x) =>
                                          x.id === product.id
                                            ? {
                                                ...x,
                                                packagingEntries: x.packagingEntries.filter((e) => e.id !== entry.id),
                                              }
                                            : x
                                        ),
                                      }))
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                                <p className="absolute top-2 left-3 text-xs font-medium text-muted-foreground">
                                  Entry {entryIdx + 1}
                                </p>
                                <div>
                                  <Label>
                                    <RequiredLabel>Description</RequiredLabel>
                                  </Label>
                                  <Textarea
                                    className="mt-1.5 min-h-[72px]"
                                    value={entry.description}
                                    onChange={(ev) =>
                                      setFormData((p) => ({
                                        ...p,
                                        products: p.products.map((x) =>
                                          x.id === product.id
                                            ? {
                                                ...x,
                                                packagingEntries: x.packagingEntries.map((row) =>
                                                  row.id === entry.id
                                                    ? { ...row, description: ev.target.value }
                                                    : row
                                                ),
                                              }
                                            : x
                                        ),
                                      }))
                                    }
                                    placeholder="Describe packaging materials and process"
                                  />
                                </div>
                                <div>
                                  <Label>
                                    <RequiredLabel>Certificate</RequiredLabel>
                                  </Label>
                                  <div className="mt-1.5 flex flex-col gap-1">
                                    <Input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={(ev) =>
                                        setFormData((p) => ({
                                          ...p,
                                          products: p.products.map((x) =>
                                            x.id === product.id
                                              ? {
                                                  ...x,
                                                  packagingEntries: x.packagingEntries.map((row) =>
                                                    row.id === entry.id
                                                      ? { ...row, certFile: ev.target.files?.[0] ?? null }
                                                      : row
                                                  ),
                                                }
                                              : x
                                          ),
                                        }))
                                      }
                                      className="cursor-pointer"
                                    />
                                    {entry.certFile && (
                                      <span className="text-xs text-muted-foreground truncate">{entry.certFile.name}</span>
                                    )}
                                    {entry.certUrl && !entry.certFile && (
                                      <a
                                        href={resolveFileUrl(entry.certUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                      >
                                        Certificate on file — View
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-violet-300/60 text-violet-800 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-950/30"
                onClick={() => setFormData((p) => ({ ...p, products: [...p.products, emptyProduct()] }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another product/service
              </Button>
            </div>
          )}

          {/* Step 4: Production System */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Enter site and production scale in square kilometres. Use whole numbers for lines, shifts, and employees.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>
                    <RequiredLabel>Total company area (sq km)</RequiredLabel>
                  </Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="mt-1.5"
                    value={formData.productionTotalCompanyAreaSqKm}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, productionTotalCompanyAreaSqKm: e.target.value }))
                    }
                    placeholder="e.g. 0.5"
                  />
                </div>
                <div>
                  <Label>
                    <RequiredLabel>Production area (sq km)</RequiredLabel>
                  </Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="mt-1.5"
                    value={formData.productionProductionAreaSqKm}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, productionProductionAreaSqKm: e.target.value }))
                    }
                    placeholder="e.g. 0.2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must not exceed total company area.</p>
                </div>
                <div>
                  <Label>
                    <RequiredLabel>Number of production lines</RequiredLabel>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="mt-1.5"
                    value={formData.productionNumLines}
                    onChange={(e) => setFormData((p) => ({ ...p, productionNumLines: e.target.value }))}
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <Label>
                    <RequiredLabel>Number of shifts</RequiredLabel>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="mt-1.5"
                    value={formData.productionNumShifts}
                    onChange={(e) => setFormData((p) => ({ ...p, productionNumShifts: e.target.value }))}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>
                    <RequiredLabel>Number of employees</RequiredLabel>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="mt-1.5 max-w-md"
                    value={formData.productionNumEmployees}
                    onChange={(e) => setFormData((p) => ({ ...p, productionNumEmployees: e.target.value }))}
                    placeholder="e.g. 120"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Declaration & Signature */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium">Mandatory declarations (all must be checked):</p>
                {[
                  { key: "declNoAlcohol", label: "No alcohol or pork used", checked: formData.declNoAlcohol },
                  { key: "declNoProhibited", label: "No prohibited ingredients used", checked: formData.declNoProhibited },
                  { key: "declMajlisCompliance", label: "Full compliance with Halal standards", checked: formData.declMajlisCompliance },
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
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Owners / managers */}
              <div className="rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Owners & managers
                </h4>
                <div className="space-y-4">
                  {formData.ownersManagers.map((owner, idx) => (
                    <div
                      key={owner.id}
                      className="rounded-md border border-emerald-200/40 dark:border-emerald-800/30 bg-background/40 p-3 text-sm"
                    >
                      <p className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                        {idx === 0 ? "Primary contact — " : ""}#{idx + 1} {owner.fullName || "—"}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 text-muted-foreground">
                        <span>National ID / Passport: <span className="text-foreground font-medium">{owner.nationalId || "—"}</span></span>
                        <span>Gender: <span className="text-foreground font-medium">{owner.gender || "—"}</span></span>
                        <span>Date of Birth: <span className="text-foreground font-medium">{owner.dateOfBirth || "—"}</span></span>
                        <span>Role: <span className="text-foreground font-medium">{owner.role || "—"}</span></span>
                        <span>Phone: <span className="text-foreground font-medium">{owner.phoneNumber || "—"}</span></span>
                        <span>Email: <span className="text-foreground font-medium">{owner.emailAddress || "—"}</span></span>
                      </div>
                      {owner.homeAddress && (
                        <p className="mt-2 text-muted-foreground">
                          Home address: <span className="text-foreground font-medium">{owner.homeAddress}</span>
                        </p>
                      )}
                    </div>
                  ))}
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
                  <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{formatBusinessCategoryLine(formData.category, formData.categoryOther)}</span></div>
                  <div><span className="text-muted-foreground">Year Established:</span> <span className="font-medium">{formData.yearEstablished || "—"}</span></div>
                  <div>
                    <span className="text-muted-foreground">Business Type:</span>{" "}
                    <span className="font-medium">
                      {formData.businessType === BUSINESS_TYPE_OTHER_LABEL
                        ? formData.businessTypeOther.trim() || "—"
                        : formData.businessType || "—"}
                    </span>
                  </div>
                  <div><span className="text-muted-foreground">TIN Number:</span> <span className="font-medium">{formData.tinNumber || "—"}</span></div>
                  <div><span className="text-muted-foreground">Business phone:</span> <span className="font-medium">{formData.businessPhone || "—"}</span></div>
                  <div><span className="text-muted-foreground">Business email:</span> <span className="font-medium">{formData.businessEmail || "—"}</span></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Website:</span> <span className="font-medium">{formData.businessWebsite || "—"}</span></div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/20 dark:bg-violet-950/20 p-4">
                <h4 className="font-semibold text-violet-800 dark:text-violet-200 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Region:</span> <span className="font-medium">{OROMIA_REGION_NAME}</span></div>
                  <div><span className="text-muted-foreground">Zone:</span> <span className="font-medium">{formData.oromiaZone || "—"}</span></div>
                  <div><span className="text-muted-foreground">District / Woreda:</span> <span className="font-medium">{formData.oromiaDistrict || "—"}</span></div>
                  {formData.kebeleName && (
                    <div><span className="text-muted-foreground">Kebele:</span> <span className="font-medium">{formData.kebeleName}</span></div>
                  )}
                  {formData.address && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Area:</span> <span className="font-medium">{formData.address}</span></div>
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
                  {formData.businessLicenseFile && (
                    <li className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Business License: {formData.businessLicenseFile.name}</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = URL.createObjectURL(formData.businessLicenseFile!);
                          window.open(url, "_blank", "noopener,noreferrer");
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                      >
                        View
                      </a>
                    </li>
                  )}
                  {formData.healthCertFile && (
                    <li className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Health Certificate: {formData.healthCertFile.name}</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = URL.createObjectURL(formData.healthCertFile!);
                          window.open(url, "_blank", "noopener,noreferrer");
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                      >
                        View
                      </a>
                    </li>
                  )}
                  {formData.iso22000CertFile && (
                    <li className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>ISO 22000 Certificate: {formData.iso22000CertFile.name}</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = URL.createObjectURL(formData.iso22000CertFile!);
                          window.open(url, "_blank", "noopener,noreferrer");
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                      >
                        View
                      </a>
                    </li>
                  )}
                  {formData.tinCertFile && (
                    <li className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>TIN Certificate: {formData.tinCertFile.name}</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = URL.createObjectURL(formData.tinCertFile!);
                          window.open(url, "_blank", "noopener,noreferrer");
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                      >
                        View
                      </a>
                    </li>
                  )}
                  {formData.ownersManagers.map((owner) =>
                    owner.ownerIdFile ? (
                      <li key={owner.id} className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          {ownerIdDocumentLabel(owner.fullName, formData.ownersManagers.length)}:{" "}
                          {owner.ownerIdFile.name}
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const url = URL.createObjectURL(owner.ownerIdFile!);
                            window.open(url, "_blank", "noopener,noreferrer");
                            setTimeout(() => URL.revokeObjectURL(url), 10000);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          View
                        </a>
                      </li>
                    ) : null
                  )}
                  {!formData.businessLicenseFile &&
                    !formData.healthCertFile &&
                    !formData.iso22000CertFile &&
                    !formData.tinCertFile &&
                    !formData.ownersManagers.some((o) => o.ownerIdFile) && (
                    <li className="text-muted-foreground">No new files selected (existing uploads are kept when you submit)</li>
                  )}
                </ul>
              </div>

              {/* Production system */}
              <div className="rounded-lg border border-sky-200/50 dark:border-sky-800/30 bg-sky-50/25 dark:bg-sky-950/20 p-4">
                <h4 className="font-semibold text-sky-800 dark:text-sky-200 mb-3 flex items-center gap-2">
                  <Factory className="h-4 w-4" /> Production system
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total company area:</span>{" "}
                    <span className="font-medium">
                      {formData.productionTotalCompanyAreaSqKm.trim()
                        ? `${formData.productionTotalCompanyAreaSqKm.trim()} sq km`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production area:</span>{" "}
                    <span className="font-medium">
                      {formData.productionProductionAreaSqKm.trim()
                        ? `${formData.productionProductionAreaSqKm.trim()} sq km`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production lines:</span>{" "}
                    <span className="font-medium">{formData.productionNumLines.trim() || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shifts:</span>{" "}
                    <span className="font-medium">{formData.productionNumShifts.trim() || "—"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Employees:</span>{" "}
                    <span className="font-medium">{formData.productionNumEmployees.trim() || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Products / Services */}
              {formData.products.some((p) => isProductRowComplete(p)) && (
                <div className="rounded-lg border border-teal-200/50 dark:border-teal-800/30 bg-gradient-to-br from-teal-50/40 via-background to-violet-50/30 dark:from-teal-950/25 dark:to-violet-950/20 p-4">
                  <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Products / Services
                  </h4>
                  <div className="space-y-4">
                    {formData.products.filter((p) => isProductRowComplete(p)).map((product, idx) => (
                      <div key={product.id} className="rounded-md border border-teal-100/80 dark:border-teal-900/40 bg-background/60 p-3 text-sm space-y-2">
                        <p className="font-medium text-teal-900 dark:text-teal-100">#{idx + 1} {formatProductLineForReview(product)}</p>
                        <div className="grid gap-1 sm:grid-cols-2 text-muted-foreground">
                          <span>Slaughter: <span className="text-foreground font-medium">{product.slaughterMethod}</span></span>
                          <span>Storage: <span className="text-foreground font-medium">{product.storageMethod}</span></span>
                          <span>Ingredients: <span className="text-foreground font-medium">{product.anyIngredients === "yes" ? "Yes" : "No"}</span></span>
                          <span>Packaging: <span className="text-foreground font-medium">{product.packaging === "yes" ? "Yes" : "No"}</span></span>
                          {product.anyIngredients === "yes" &&
                            product.ingredientEntries.map((ing, i) => {
                              const desc = (ing.description ?? "").trim();
                              const hasCert = !!ing.certFile || !!(ing.certUrl ?? "").trim();
                              if (!desc && !hasCert) return null;
                              return (
                                <div
                                  key={ing.id}
                                  className="sm:col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1"
                                >
                                  <span>
                                    Ingredient {i + 1}:{" "}
                                    <span className="text-foreground font-medium">{desc || "—"}</span>
                                  </span>
                                  {hasCert ? (
                                    ing.certFile ? (
                                      <Button
                                        type="button"
                                        variant="link"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const url = URL.createObjectURL(ing.certFile!);
                                          window.open(url, "_blank", "noopener,noreferrer");
                                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                                        }}
                                      
                                      >
                                        View
                                      </Button>
                                    ) : (
                                      <a
                                        href={resolveFileUrl(ing.certUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                      >
                                        View
                                      </a>
                                    )
                                  ) : null}
                                </div>
                              );
                            })}
                          {product.packaging === "yes" &&
                            product.packagingEntries.map((pkg, i) => {
                              const desc = (pkg.description ?? "").trim();
                              const hasCert = !!pkg.certFile || !!(pkg.certUrl ?? "").trim();
                              if (!desc && !hasCert) return null;
                              return (
                                <div
                                  key={pkg.id}
                                  className="sm:col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1"
                                >
                                  <span>
                                    Packaging {i + 1}:{" "}
                                    <span className="text-foreground font-medium">{desc || "—"}</span>
                                  </span>
                                  {hasCert ? (
                                    pkg.certFile ? (
                                      <Button
                                        type="button"
                                        variant="link"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const url = URL.createObjectURL(pkg.certFile!);
                                          window.open(url, "_blank", "noopener,noreferrer");
                                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                                        }}
                                      >
                                        View
                                      </Button>
                                    ) : (
                                      <a
                                        href={resolveFileUrl(pkg.certUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                                      >
                                        View
                                      </a>
                                    )
                                  ) : null}
                                </div>
                              );
                            })}
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
            {currentStep < 6 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={
                  (currentStep === 1 && !canProceed()) ||
                  (currentStep === 2 && !canProceed()) ||
                  (currentStep === 3 && !canProceed()) ||
                  (currentStep === 4 && !canProceed()) ||
                  (currentStep === 5 && !canProceed())
                }
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
