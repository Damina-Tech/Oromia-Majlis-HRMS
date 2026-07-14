import type { MemberCategory } from "@/services/membership";

const STORAGE_KEY = "majlis-membership-registration";

export type SerializableRegistrationForm = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  oromiaZone: string;
  oromiaDistrict: string;
  addressLine: string;
  nationalId: string;
  category: MemberCategory | "";
  categoryData: Record<string, unknown>;
  profilePhotoDataUrl?: string;
  profilePhotoName?: string;
};

export type StoredRegistrationState = {
  step: number;
  form: SerializableRegistrationForm;
  password: string;
  passwordConfirm: string;
};

export function loadRegistrationDraft(): StoredRegistrationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredRegistrationState;
  } catch {
    return null;
  }
}

export function saveRegistrationDraft(state: StoredRegistrationState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors (e.g. large profile photo)
  }
}

export function clearRegistrationDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export function serializeFormForStorage(form: {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  oromiaZone: string;
  oromiaDistrict: string;
  addressLine: string;
  nationalId: string;
  category: MemberCategory | "";
  categoryData: Record<string, unknown>;
  profilePhoto: File | null;
  profilePhotoDataUrl?: string;
  profilePhotoName?: string;
}): SerializableRegistrationForm {
  const { profilePhoto: _photo, ...rest } = form;
  return rest;
}
