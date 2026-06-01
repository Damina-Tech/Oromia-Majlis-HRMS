import api from "./api";

// Types
export type DocumentTemplateEngine = "HTML_MERGE" | "PDF_CERTIFICATE";
export type HalalCertificateTemplateType = "HALAL_BUSINESS" | "HALAL_PRODUCT";

export interface CertificateLayoutField {
  key: string;
  label: string;
  type: "text" | "date" | "qrcode" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  align?: "left" | "center" | "right";
  color?: string;
}

export interface CertificateLayoutConfig {
  version: 1;
  pageWidth: number;
  pageHeight: number;
  fields: CertificateLayoutField[];
}

export interface DocumentTemplate {
  id: string;
  code: string;
  name: string;
  category: "HR" | "PAYROLL" | "LEGAL" | "CERTIFICATE" | "WARNING" | "CONTRACT" | "OTHER";
  description?: string;
  content: string;
  contentPlain?: string;
  version: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  language: "EN" | "AM" | "OR";
  tags: string[];
  active: boolean;
  templateEngine?: DocumentTemplateEngine;
  certificateType?: HalalCertificateTemplateType | null;
  layoutConfig?: CertificateLayoutConfig | null;
  /** Server path to uploaded blank agreement (PDF/DOC), e.g. /uploads/document-template-sources/... */
  sourceFileUrl?: string | null;
  mergeFields?: any;
  createdBy: string;
  updatedBy?: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    generatedDocuments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  template: {
    id: string;
    name: string;
    code: string;
    category: string;
  };
  employeeId?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  generatedBy: string;
  generatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  generatedFor?: string;
  fileUrl: string;
  fileName: string;
  format: string;
  fileSize?: number;
  meta?: any;
  createdAt: string;
}

export interface MergeField {
  [category: string]: {
    [field: string]: string;
  };
}

export interface CreateTemplateData {
  code: string;
  name: string;
  category: DocumentTemplate["category"];
  description?: string;
  content?: string;
  contentPlain?: string;
  language?: DocumentTemplate["language"];
  tags?: string[];
  sourceFileUrl?: string;
  templateEngine?: DocumentTemplateEngine;
  certificateType?: HalalCertificateTemplateType;
  layoutConfig?: CertificateLayoutConfig;
}

export interface UpdateTemplateData {
  name?: string;
  category?: DocumentTemplate["category"];
  description?: string;
  content?: string;
  contentPlain?: string;
  status?: DocumentTemplate["status"];
  language?: DocumentTemplate["language"];
  tags?: string[];
  active?: boolean;
  sourceFileUrl?: string | null;
  templateEngine?: DocumentTemplateEngine;
  certificateType?: HalalCertificateTemplateType | null;
  layoutConfig?: CertificateLayoutConfig | null;
}

export interface GenerateDocumentData {
  templateId: string;
  employeeId?: string;
  employeeIds?: string[];
  departmentId?: string;
  mergeData?: Record<string, any>;
  email?: boolean;
  format?: "pdf" | "docx" | "html";
}

export interface PreviewDocumentData {
  templateId: string;
  employeeId?: string;
  mergeData?: Record<string, any>;
  useSampleData?: boolean;
}

// API Functions

export const getCertificateFieldCatalog = async (certificateType: HalalCertificateTemplateType) => {
  const response = await api.get(`/documents/certificates/field-catalog/${certificateType}`);
  return response.data as {
    certificateType: HalalCertificateTemplateType;
    fields: Array<{ key: string; label: string; type: "text" | "date" | "qrcode" | "image" }>;
  };
};

export const previewCertificatePdf = async (templateId: string): Promise<Blob> => {
  const response = await api.post(
    "/documents/certificates/preview",
    { templateId },
    { responseType: "blob" }
  );
  return response.data as Blob;
};

export const listTemplates = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  active?: boolean;
  language?: string;
  tags?: string;
  code?: string;
  templateEngine?: DocumentTemplateEngine;
  certificateType?: HalalCertificateTemplateType;
}) => {
  const response = await api.get("/documents/templates", { params });
  return response.data;
};

export const getTemplate = async (id: string) => {
  const response = await api.get(`/documents/templates/${id}`);
  return response.data;
};

export const createTemplate = async (data: CreateTemplateData) => {
  const response = await api.post("/documents/templates", data);
  return response.data;
};

export const uploadTemplateSourceFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<{ url: string }>("/documents/templates/source-upload", formData);
  return response.data;
};

/** Upload signature or seal PNG/JPEG used on all certificate PDFs (saved to document settings). */
export const uploadCertificateAsset = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<{ url: string }>("/documents/certificate-assets/upload", formData);
  return response.data;
};

export const updateTemplate = async (id: string, data: UpdateTemplateData) => {
  const response = await api.put(`/documents/templates/${id}`, data);
  return response.data;
};

export const deleteTemplate = async (id: string) => {
  await api.delete(`/documents/templates/${id}`);
};

export const previewTemplate = async (data: PreviewDocumentData) => {
  const response = await api.post("/documents/templates/preview", data);
  return response.data;
};

export const generateDocument = async (data: GenerateDocumentData) => {
  const response = await api.post("/documents/generate", data);
  return response.data;
};

export const listGeneratedDocuments = async (params?: {
  page?: number;
  pageSize?: number;
  templateId?: string;
  employeeId?: string;
  generatedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const response = await api.get("/documents/generated", { params });
  return response.data;
};

export const downloadDocument = async (id: string) => {
  const response = await api.get(`/documents/generated/${id}/download`, {
    responseType: "blob",
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", id);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getMergeFields = async (): Promise<MergeField> => {
  const response = await api.get("/documents/merge-fields");
  return response.data;
};

// Helper functions
export const getCategoryLabel = (category: DocumentTemplate["category"]): string => {
  const labels: Record<DocumentTemplate["category"], string> = {
    HR: "HR Documents",
    PAYROLL: "Payroll",
    LEGAL: "Legal",
    CERTIFICATE: "Certificate",
    WARNING: "Warning",
    CONTRACT: "Contract",
    OTHER: "Other",
  };
  return labels[category] || category;
};

export const getStatusLabel = (status: DocumentTemplate["status"]): string => {
  const labels: Record<DocumentTemplate["status"], string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    ARCHIVED: "Archived",
  };
  return labels[status] || status;
};

export const getStatusColor = (status: DocumentTemplate["status"]): string => {
  const colors: Record<DocumentTemplate["status"], string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    ARCHIVED: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getCategoryColor = (category: DocumentTemplate["category"]): string => {
  const colors: Record<DocumentTemplate["category"], string> = {
    HR: "bg-blue-100 text-blue-800",
    PAYROLL: "bg-purple-100 text-purple-800",
    LEGAL: "bg-red-100 text-red-800",
    CERTIFICATE: "bg-green-100 text-green-800",
    WARNING: "bg-orange-100 text-orange-800",
    CONTRACT: "bg-indigo-100 text-indigo-800",
    OTHER: "bg-gray-100 text-gray-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
};

// Document Settings Types and Functions
export interface DocumentSettings {
  id: string;
  companyName: string;
  companyLogo?: string;
  headerText?: string;
  footerText?: string;
  stampImage?: string;
  signatureImage?: string;
  signatureName?: string;
  signatureTitle?: string;
  defaultLanguage: "EN" | "AM" | "OR";
  dateFormat: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentSettingsData {
  companyName: string;
  companyLogo?: string;
  headerText?: string;
  footerText?: string;
  stampImage?: string;
  signatureImage?: string;
  signatureName?: string;
  signatureTitle?: string;
  defaultLanguage?: "EN" | "AM" | "OR";
  dateFormat?: string;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

export interface UpdateDocumentSettingsData extends Partial<CreateDocumentSettingsData> {}

export const getDocumentSettings = async (): Promise<DocumentSettings> => {
  const response = await api.get("/documents/settings");
  return response.data;
};

export const createDocumentSettings = async (data: CreateDocumentSettingsData): Promise<DocumentSettings> => {
  const response = await api.post("/documents/settings", data);
  return response.data;
};

export const updateDocumentSettings = async (data: UpdateDocumentSettingsData): Promise<DocumentSettings> => {
  const response = await api.put("/documents/settings", data);
  return response.data;
};

// Document Request Types and Functions
export interface DocumentRequest {
  id: string;
  employeeId: string;
  templateId: string;
  purpose?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "GENERATED" | "CANCELLED";
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  generatedDocumentId?: string;
  notes?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
  };
  template?: {
    id: string;
    name: string;
    code: string;
    category: string;
  };
  requestedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejectedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  generatedDocument?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequestData {
  templateId: string;
  purpose?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface UpdateDocumentRequestData {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "GENERATED" | "CANCELLED";
  rejectionReason?: string;
  notes?: string;
}

export interface ListDocumentRequestsQuery {
  page?: number;
  pageSize?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "GENERATED" | "CANCELLED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  employeeId?: string;
  templateId?: string;
  search?: string;
}

export const createDocumentRequest = async (data: CreateDocumentRequestData): Promise<DocumentRequest> => {
  const response = await api.post("/documents/requests", data);
  return response.data;
};

export const listDocumentRequests = async (query?: ListDocumentRequestsQuery): Promise<{
  items: DocumentRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const response = await api.get("/documents/requests", { params: query });
  return response.data;
};

export const getDocumentRequest = async (id: string): Promise<DocumentRequest> => {
  const response = await api.get(`/documents/requests/${id}`);
  return response.data;
};

export const updateDocumentRequest = async (id: string, data: UpdateDocumentRequestData): Promise<DocumentRequest> => {
  const response = await api.put(`/documents/requests/${id}`, data);
  return response.data;
};

export const deleteDocumentRequest = async (id: string): Promise<void> => {
  await api.delete(`/documents/requests/${id}`);
};

export const getRequestStatusLabel = (status: DocumentRequest["status"]): string => {
  const labels: Record<DocumentRequest["status"], string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    GENERATED: "Generated",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

export const getRequestStatusColor = (status: DocumentRequest["status"]): string => {
  const colors: Record<DocumentRequest["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    GENERATED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getPriorityLabel = (priority: DocumentRequest["priority"]): string => {
  const labels: Record<DocumentRequest["priority"], string> = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    URGENT: "Urgent",
  };
  return labels[priority] || priority;
};

export const getPriorityColor = (priority: DocumentRequest["priority"]): string => {
  const colors: Record<DocumentRequest["priority"], string> = {
    LOW: "bg-gray-100 text-gray-800",
    NORMAL: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
};

