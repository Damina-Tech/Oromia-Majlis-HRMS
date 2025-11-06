import api from "./api";

// Types
export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "GENERAL" | "HR" | "FINANCE" | "MEETING" | "SYSTEM";
  urgency: "NORMAL" | "IMPORTANT" | "URGENT";
  publishAt?: string;
  expireAt?: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "CANCELLED";
  target: {
    type: "all" | "role" | "department" | "employees" | "group";
    ids?: string[];
  };
  channels: ("IN_APP" | "EMAIL" | "SMS" | "WHATSAPP")[];
  requiresAck: boolean;
  requiresRSVP: boolean;
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
  attachments?: AnnouncementAttachment[];
  deliveries?: AnnouncementDelivery[];
  reads?: AnnouncementRead[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Frontend computed fields
  isRead?: boolean;
  readAt?: string;
  acknowledged?: boolean;
  _count?: {
    reads: number;
    deliveries: number;
  };
}

export interface AnnouncementAttachment {
  id: string;
  announcementId: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface AnnouncementDelivery {
  id: string;
  announcementId: string;
  channel: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
  status: "QUEUED" | "SENT" | "FAILED" | "RETRYING";
  userId?: string;
  employeeId?: string;
  recipient?: string;
  providerRef?: string;
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  readAt: string;
  acknowledged: boolean;
  deviceInfo?: any;
  createdAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  body: string;
  type: "GENERAL" | "HR" | "FINANCE" | "MEETING" | "SYSTEM";
  urgency?: "NORMAL" | "IMPORTANT" | "URGENT";
  publishAt?: string;
  expireAt?: string;
  target: {
    type: "all" | "role" | "department" | "employees" | "group";
    ids?: string[];
  };
  channels: ("IN_APP" | "EMAIL" | "SMS" | "WHATSAPP")[];
  requiresAck?: boolean;
  requiresRSVP?: boolean;
  attachmentIds?: string[];
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "CANCELLED";
}

export interface ListAnnouncementsQuery {
  page?: number;
  pageSize?: number;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "CANCELLED";
  type?: "GENERAL" | "HR" | "FINANCE" | "MEETING" | "SYSTEM";
  urgency?: "NORMAL" | "IMPORTANT" | "URGENT";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
}

export interface AcknowledgeAnnouncementData {
  acknowledged?: boolean;
  deviceInfo?: any;
}

// API Functions
export const createAnnouncement = async (data: CreateAnnouncementData): Promise<Announcement> => {
  const response = await api.post("/announcements", data);
  return response.data;
};

export const listAnnouncements = async (query?: ListAnnouncementsQuery): Promise<{
  items: Announcement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const response = await api.get("/announcements", { params: query });
  return response.data;
};

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};

export const updateAnnouncement = async (id: string, data: UpdateAnnouncementData): Promise<Announcement> => {
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await api.delete(`/announcements/${id}`);
};

export const publishAnnouncement = async (id: string): Promise<Announcement> => {
  const response = await api.post(`/announcements/${id}/publish`);
  return response.data;
};

export const acknowledgeAnnouncement = async (id: string, data?: AcknowledgeAnnouncementData): Promise<AnnouncementRead> => {
  const response = await api.post(`/announcements/${id}/ack`, data || {});
  return response.data;
};

export const listAnnouncementReads = async (id: string, query?: { page?: number; pageSize?: number; acknowledgedOnly?: boolean }): Promise<{
  items: AnnouncementRead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const response = await api.get(`/announcements/${id}/reads`, { params: query });
  return response.data;
};

export const getAnnouncementStats = async (id: string): Promise<any> => {
  const response = await api.get(`/announcements/${id}/stats`);
  return response.data;
};

// Helper functions
export const getTypeLabel = (type: Announcement["type"]): string => {
  const labels: Record<Announcement["type"], string> = {
    GENERAL: "General",
    HR: "HR",
    FINANCE: "Finance",
    MEETING: "Meeting",
    SYSTEM: "System",
  };
  return labels[type] || type;
};

export const getTypeColor = (type: Announcement["type"]): string => {
  const colors: Record<Announcement["type"], string> = {
    GENERAL: "bg-gray-100 text-gray-800",
    HR: "bg-blue-100 text-blue-800",
    FINANCE: "bg-green-100 text-green-800",
    MEETING: "bg-purple-100 text-purple-800",
    SYSTEM: "bg-orange-100 text-orange-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

export const getUrgencyLabel = (urgency: Announcement["urgency"]): string => {
  const labels: Record<Announcement["urgency"], string> = {
    NORMAL: "Normal",
    IMPORTANT: "Important",
    URGENT: "Urgent",
  };
  return labels[urgency] || urgency;
};

export const getUrgencyColor = (urgency: Announcement["urgency"]): string => {
  const colors: Record<Announcement["urgency"], string> = {
    NORMAL: "bg-gray-100 text-gray-800",
    IMPORTANT: "bg-yellow-100 text-yellow-800",
    URGENT: "bg-red-100 text-red-800",
  };
  return colors[urgency] || "bg-gray-100 text-gray-800";
};

export const getStatusLabel = (status: Announcement["status"]): string => {
  const labels: Record<Announcement["status"], string> = {
    DRAFT: "Draft",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

export const getStatusColor = (status: Announcement["status"]): string => {
  const colors: Record<Announcement["status"], string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    PUBLISHED: "bg-green-100 text-green-800",
    EXPIRED: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getChannelLabel = (channel: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP"): string => {
  const labels = {
    IN_APP: "In-App",
    EMAIL: "Email",
    SMS: "SMS",
    WHATSAPP: "WhatsApp",
  };
  return labels[channel] || channel;
};
