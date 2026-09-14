import api from "./api";

export interface Region {
  id: string;
  name: string;
  code?: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  code?: string;
  regionId: string;
  woredas?: Woreda[];
}

export interface Woreda {
  id: string;
  name: string;
  code?: string;
  zoneId: string;
  kebeles?: Kebele[];
}

export interface Kebele {
  id: string;
  name: string;
  code?: string;
  woredaId: string;
}

export type InstitutionType = "MOSQUE" | "MADRASAH" | "MARKAZ";
export type InstitutionStatus = "ACTIVE" | "UNDER_CONSTRUCTION" | "CLOSED" | "SUSPENDED";
export type OwnershipStatus = "MAJLIS_OWNED" | "COMMUNITY_OWNED" | "WAQF";
export type InstitutionRole =
  | "IMAM"
  | "MUAZZIN"
  | "MOSQUE_COMMITTEE_MEMBER"
  | "MADRASAH_DIRECTOR"
  | "MADRASAH_BOARD_MEMBER"
  | "MARKAZ_DIRECTOR"
  | "MARKAZ_COMMITTEE_MEMBER";
export type AssignmentStatus = "ACTIVE" | "ENDED" | "SUSPENDED" | "PENDING_APPROVAL";

export interface MosqueData {
  capacity?: number;
  jummahAvailable?: boolean;
  womenPrayerSpace?: boolean;
  utilities?: {
    water?: boolean;
    electricity?: boolean;
  };
}

export interface MadrasahData {
  curriculumType: "INTEGRATED";
  gradeLevels: ("PRIMARY" | "SECONDARY" | "PREPARATORY")[];
  accreditationStatus: "ACCREDITED" | "PROVISIONALLY_ACCREDITED" | "NOT_ACCREDITED";
  students?: {
    male?: number;
    female?: number;
  };
  teachers?: {
    islamic?: number;
    science?: number;
  };
  classrooms?: number;
  hasLabs?: boolean;
  hasLibrary?: boolean;
}

export interface MarkazData {
  disciplines: ("QURAN" | "HADITH" | "TAFSIR" | "FIQH" | "AQEEDAH" | "TARBIYA" | "ARABIC")[];
  studyLevels: ("BEGINNER" | "INTERMEDIATE" | "ADVANCED")[];
  daawahActivities?: boolean;
  students?: number;
  scholars?: number;
  hasBoarding?: boolean;
  hasLibrary?: boolean;
}

export interface InstitutionSubmitter {
  source?: "PUBLIC" | "ADMIN";
  name?: string;
  phone?: string;
  email?: string | null;
  role?: string;
  submittedAt?: string;
}

export type InstitutionCreatePayload = {
  name: string;
  type: InstitutionType;
  status?: InstitutionStatus;
  regionId?: string;
  zoneId?: string;
  woredaId?: string;
  kebeleId?: string;
  kebeleName?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  yearEstablished?: number;
  ownershipStatus?: OwnershipStatus;
  mosqueData?: MosqueData;
  madrasahData?: MadrasahData;
  markazData?: MarkazData;
  submitter?: {
    name: string;
    phone: string;
    email?: string;
    role: string;
  };
  password?: string;
  imageFile?: File;
};

export type InstitutionPublicRegisterResponse = {
  institution: Institution;
  user: { id: string; email: string; firstName: string; lastName: string };
  message?: string;
};

export interface Institution {
  id: string;
  institutionCode: string;
  name: string;
  type: InstitutionType;
  status: InstitutionStatus;
  regionId?: string;
  region?: Region;
  zoneId?: string;
  zone?: Zone;
  woredaId?: string;
  woreda?: Woreda;
  kebeleId?: string;
  kebele?: Kebele;
  kebeleName?: string; // Manual kebele name (free text)
  latitude?: number;
  longitude?: number;
  address?: string;
  yearEstablished?: number;
  ownershipStatus?: OwnershipStatus;
  imageUrl?: string | null;
  mosqueData?: MosqueData;
  madrasahData?: MadrasahData;
  markazData?: MarkazData;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  ownerUserId?: string | null;
  ownerUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  submitter?: InstitutionSubmitter | null;
  approvedById?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignments?: InstitutionAssignment[];
  _count?: {
    assignments: number;
    auditLogs: number;
  };
}

export interface InstitutionAssignment {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    designation?: string;
  };
  institutionId: string;
  institution?: {
    id: string;
    institutionCode: string;
    name: string;
    type: InstitutionType;
  };
  institutionType: InstitutionType;
  role: InstitutionRole;
  status: AssignmentStatus;
  startDate: string;
  endDate?: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvalDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionStats {
  totalInstitutions: number;
  byType: Record<InstitutionType, number>;
  byStatus: Record<InstitutionStatus, number>;
  byOwnership: Record<string, number>;
  pendingApprovals: number;
  activeAssignments: number;
}

// Geographic Hierarchy APIs
export const regionsApi = {
  list: async (): Promise<Region[]> => {
    const response = await api.get("/institutions/regions");
    return response.data;
  },
  create: async (data: { name: string; code?: string }): Promise<Region> => {
    const response = await api.post("/institutions/regions", data);
    return response.data;
  },
};

export const zonesApi = {
  create: async (data: { name: string; code?: string; regionId: string }): Promise<Zone> => {
    const response = await api.post("/institutions/zones", data);
    return response.data;
  },
};

export const woredasApi = {
  create: async (data: { name: string; code?: string; zoneId: string }): Promise<Woreda> => {
    const response = await api.post("/institutions/woredas", data);
    return response.data;
  },
};

export const kebelesApi = {
  create: async (data: { name: string; code?: string; woredaId: string }): Promise<Kebele> => {
    const response = await api.post("/institutions/kebeles", data);
    return response.data;
  },
};

// Institution APIs
export const institutionsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    type?: InstitutionType;
    status?: InstitutionStatus;
    regionId?: string;
    zoneId?: string;
    woredaId?: string;
    search?: string;
  }): Promise<{ items: Institution[]; total: number; page: number; limit: number }> => {
    const response = await api.get("/institutions", { params });
    return response.data;
  },
  get: async (id: string): Promise<Institution> => {
    const response = await api.get(`/institutions/${id}`);
    return response.data;
  },
  listMine: async (): Promise<{ items: Institution[]; total: number }> => {
    const response = await api.get("/institutions/mine");
    return response.data;
  },
  create: async (data: InstitutionCreatePayload): Promise<Institution> => {
    const response = await api.post("/institutions", data);
    return response.data;
  },
  registerPublic: async (data: InstitutionCreatePayload): Promise<InstitutionPublicRegisterResponse> => {
    if (!data.password || !data.imageFile || !data.submitter) {
      throw new Error("Password, image, and contact details are required");
    }
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("type", data.type);
    if (data.status) fd.append("status", data.status);
    if (data.regionId) fd.append("regionId", data.regionId);
    if (data.zoneId) fd.append("zoneId", data.zoneId);
    if (data.woredaId) fd.append("woredaId", data.woredaId);
    if (data.kebeleId) fd.append("kebeleId", data.kebeleId);
    if (data.kebeleName) fd.append("kebeleName", data.kebeleName);
    if (data.latitude != null) fd.append("latitude", String(data.latitude));
    if (data.longitude != null) fd.append("longitude", String(data.longitude));
    if (data.address) fd.append("address", data.address);
    if (data.yearEstablished != null) fd.append("yearEstablished", String(data.yearEstablished));
    if (data.ownershipStatus) fd.append("ownershipStatus", data.ownershipStatus);
    if (data.mosqueData) fd.append("mosqueData", JSON.stringify(data.mosqueData));
    if (data.madrasahData) fd.append("madrasahData", JSON.stringify(data.madrasahData));
    if (data.markazData) fd.append("markazData", JSON.stringify(data.markazData));
    fd.append("submitter", JSON.stringify(data.submitter));
    fd.append("password", data.password);
    fd.append("image", data.imageFile);
    const response = await api.post("/institutions/public/register", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  update: async (id: string, data: Partial<Institution>): Promise<Institution> => {
    const response = await api.patch(`/institutions/${id}`, data);
    return response.data;
  },
  approve: async (id: string, data: { approved: boolean; notes?: string }): Promise<Institution> => {
    const response = await api.post(`/institutions/${id}/approve`, data);
    return response.data;
  },
  getStats: async (params?: {
    regionId?: string;
    zoneId?: string;
    woredaId?: string;
  }): Promise<InstitutionStats> => {
    const response = await api.get("/institutions/stats", { params });
    return response.data;
  },
};

// Assignment APIs
export const assignmentsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    institutionId?: string;
    role?: InstitutionRole;
    status?: AssignmentStatus;
  }): Promise<{ items: InstitutionAssignment[]; total: number; page: number; limit: number }> => {
    const response = await api.get("/institutions/assignments", { params });
    return response.data;
  },
  create: async (data: {
    employeeId: string;
    institutionId: string;
    role: InstitutionRole;
    startDate: string;
    endDate?: string;
  }): Promise<InstitutionAssignment> => {
    const response = await api.post("/institutions/assignments", data);
    return response.data;
  },
  approve: async (id: string, data: { approved: boolean; rejectionReason?: string }): Promise<InstitutionAssignment> => {
    const response = await api.post(`/institutions/assignments/${id}/approve`, data);
    return response.data;
  },
  end: async (id: string): Promise<InstitutionAssignment> => {
    const response = await api.post(`/institutions/assignments/${id}/end`);
    return response.data;
  },
};

