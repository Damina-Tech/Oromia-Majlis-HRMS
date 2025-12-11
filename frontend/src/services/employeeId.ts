import api from "./api";

export type IdCardCodeType = "QR" | "BARCODE" | "NONE";
export type IdCardSize = "ID1" | "ID2" | "ID3" | "CUSTOM";
export type IdCardLayout = "PHOTO_LEFT" | "PHOTO_RIGHT" | "PHOTO_TOP";

export interface IdCardTemplateSettings {
  size: IdCardSize;
  customDimensions?: { width: number; height: number };
  background: { type: "color" | "image"; value: string };
  border: { width: number; color: string; radius: number };
  text: { color: string; fontFamily: string; fontSize: number; headingSize: number };
  layout: IdCardLayout;
  fieldVisibility: {
    showEmployeeName: boolean;
    showJobTitle: boolean;
    showDepartment: boolean;
    showEmployeeCode: boolean;
    showPhoto: boolean;
    showCompanyLogo: boolean;
    showIssueDate: boolean;
    showExpiryDate: boolean;
    showBarcode: boolean;
    showSignature: boolean;
    showStamp: boolean;
  };
  assets?: {
    logoUrl?: string;
    signatureUrl?: string;
    stampUrl?: string;
    backgroundUrl?: string;
  };
  placement?: {
    photo?: { x: number; y: number; width: number; height: number };
    content?: { x: number; y: number; width: number };
  };
  extraLines: string[];
  codeType: IdCardCodeType;
}

export interface IdCardTemplate {
  id: string;
  name: string;
  description?: string | null;
  settings: IdCardTemplateSettings;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateIdCardPayload {
  templateId?: string;
  issueDate?: string;
  expiryDate?: string;
  codeType?: IdCardCodeType;
}

export interface GenerateIdCardResponse {
  employeeId: string;
  pdfUrl: string;
  pngUrl: string;
  metadata?: Record<string, unknown>;
  template: IdCardTemplate;
}

export interface BatchGenerateIdCardsPayload {
  templateId: string;
  employeeIds: string[];
  issueDate?: string;
  expiryDate?: string;
}

export interface BatchGenerateIdCardsResponse {
  results: Array<{ employeeId: string; pdfUrl: string; pngUrl: string }>;
  zipUrl: string;
}

export async function listIdCardTemplates(): Promise<IdCardTemplate[]> {
  const { data } = await api.get("/employees/id-templates");
  return data;
}

export async function createIdCardTemplate(payload: {
  name: string;
  description?: string;
  settings: IdCardTemplateSettings;
  isDefault?: boolean;
}): Promise<IdCardTemplate> {
  const { data } = await api.post("/employees/id-templates", payload);
  return data;
}

export async function updateIdCardTemplate(
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    settings?: IdCardTemplateSettings;
    isDefault?: boolean;
  }
): Promise<IdCardTemplate> {
  const { data } = await api.put(`/employees/id-templates/${id}`, payload);
  return data;
}

export async function setDefaultIdCardTemplate(id: string): Promise<IdCardTemplate> {
  const { data } = await api.post(`/employees/id-templates/${id}/default`, {});
  return data;
}

export async function generateEmployeeIdCard(
  employeeId: string,
  payload: GenerateIdCardPayload
): Promise<GenerateIdCardResponse> {
  const { data } = await api.post(`/employees/${employeeId}/id-card`, payload);
  return data;
}

export async function batchGenerateIdCards(
  payload: BatchGenerateIdCardsPayload
): Promise<BatchGenerateIdCardsResponse> {
  const { data } = await api.post("/employees/id-cards/batch", payload);
  return data;
}

