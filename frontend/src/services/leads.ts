import api from "./api";

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "ENGAGED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "READY_TO_CONVERT"
  | "CONVERTED"
  | "ARCHIVED";

export type LeadStatus = "ACTIVE" | "CONVERTED" | "ARCHIVED";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH";
export type LeadDispositionReason =
  | "PRICE"
  | "NOT_INTERESTED"
  | "WRONG_CONTACT"
  | "COMPETITOR"
  | "POSTPONED"
  | "OTHER";

export interface LeadNote {
  id: string;
  content: string;
  attachments?: Array<{ name: string; url: string }>;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface LeadHistory {
  id: string;
  action: string;
  fromStage?: LeadStage | null;
  toStage?: LeadStage | null;
  note?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface LeadTaskLink {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
  };
}

export interface LeadSummary {
  id: string;
  fullName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  interest?: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  status: LeadStatus;
  createdAt: string;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  assignedDepartment?: {
    id: string;
    name: string;
  } | null;
  disposition?: {
    reason: LeadDispositionReason;
  } | null;
}

export interface LeadDetail extends LeadSummary {
  location?: string | null;
  companyName?: string | null;
  website?: string | null;
  tags?: string[];
  timezone?: string | null;
  potentialValue?: number;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  notes: LeadNote[];
  histories: LeadHistory[];
  taskLinks: LeadTaskLink[];
}

export interface LeadListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: LeadStage;
  status?: LeadStatus;
  priority?: LeadPriority;
  assignedToUserId?: string;
  assignedDepartmentId?: string;
  source?: string;
}

export interface LeadListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: LeadSummary[];
  summary: {
    stageCounts: Array<{ stage: LeadStage; count: number }>;
    topSources: Array<{ source: string; count: number }>;
  };
}

export type LeadKanbanResponse = Record<LeadStage, LeadSummary[]>;

export interface LeadDashboardResponse {
  metrics: {
    totals?: {
      total: number;
      converted: number;
      conversionRate: number;
    };
    funnel?: Array<{ stage: LeadStage; count: number }>;
    sources?: Array<{ source: string; count: number }>;
  } | null;
  hotLeads: LeadSummary[];
}

export async function listLeads(query?: LeadListQuery): Promise<LeadListResponse> {
  const { data } = await api.get("/leads", { params: query });
  return data;
}

export async function getLead(id: string): Promise<LeadDetail> {
  const { data } = await api.get(`/leads/${id}`);
  return data;
}

export async function createLead(payload: Record<string, unknown>): Promise<LeadDetail> {
  const { data } = await api.post("/leads", payload);
  return data;
}

export async function updateLead(id: string, payload: Record<string, unknown>): Promise<LeadDetail> {
  const { data } = await api.patch(`/leads/${id}`, payload);
  return data;
}

export async function changeLeadStage(id: string, payload: { stage: LeadStage; note?: string }) {
  const { data } = await api.post(`/leads/${id}/stage`, payload);
  return data;
}

export async function assignLead(
  id: string,
  payload: { assignedToUserId: string; assignedDepartmentId?: string; priority?: LeadPriority }
) {
  const { data } = await api.post(`/leads/${id}/assign`, payload);
  return data;
}

export async function addLeadNote(id: string, payload: { content: string; attachments?: any[] }) {
  const { data } = await api.post(`/leads/${id}/notes`, payload);
  return data as LeadNote;
}

export async function dispositionLead(
  id: string,
  payload: { reason: LeadDispositionReason; note?: string }
) {
  const { data } = await api.post(`/leads/${id}/disposition`, payload);
  return data;
}

export async function importLeads(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/leads/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchLeadKanban(params?: { assignedToUserId?: string; priority?: LeadPriority }) {
  const { data } = await api.get("/leads/kanban", { params });
  return data as LeadKanbanResponse;
}

export async function fetchLeadDashboard(): Promise<LeadDashboardResponse> {
  const { data } = await api.get("/leads/dashboard");
  return data;
}

