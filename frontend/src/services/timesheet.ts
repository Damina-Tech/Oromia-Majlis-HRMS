import api from "./api";

// Types
export interface TimesheetSession {
  id: string;
  taskName: string;
  projectName: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  totalHours: number | string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string;
    email?: string;
    phone?: string;
    department?: {
      id: string;
      name: string;
    };
  };
  sessions: TimesheetSession[];
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TimesheetSummary {
  totalTimesheets: number;
  totalHours: number | string;
  averageHours: number | string;
  statusBreakdown: {
    draft?: number;
    submitted?: number;
    approved?: number;
    rejected?: number;
  };
  timesheets: Timesheet[];
}

export interface ListTimesheetParams {
  employeeId?: string;
  date?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  week?: string; // YYYY-WXX
  month?: string; // YYYY-MM
  year?: string; // YYYY
  page?: number;
  pageSize?: number;
}

export interface TimesheetSummaryParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  week?: string;
  month?: string;
  year?: string;
}

export interface CreateTimesheetSessionData {
  taskName: string;
  projectName: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  duration: number; // in minutes
}

export interface CreateTimesheetData {
  date: string; // YYYY-MM-DD
  sessions: CreateTimesheetSessionData[];
  notes?: string;
}

export interface UpdateTimesheetData {
  date?: string; // YYYY-MM-DD
  sessions?: CreateTimesheetSessionData[];
  notes?: string;
}

export interface SubmitTimesheetData {
  notes?: string;
}

export interface UpdateTimesheetStatusData {
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  notes?: string;
}

export interface StartTimerData {
  taskName: string;
  projectName: string;
  description?: string;
}

export interface StopTimerData {
  notes?: string;
}

export interface ManualTimeEntryData {
  taskName: string;
  projectName: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  notes?: string;
}

// API Functions
export const listTimesheets = async (params?: ListTimesheetParams) => {
  const response = await api.get("/timesheets", { params });
  return response.data;
};

export const getTimesheet = async (id: string): Promise<Timesheet> => {
  const response = await api.get(`/timesheets/${id}`);
  return response.data;
};

export const createTimesheet = async (data: CreateTimesheetData): Promise<Timesheet> => {
  const response = await api.post("/timesheets", data);
  return response.data;
};

export const updateTimesheet = async (id: string, data: UpdateTimesheetData): Promise<Timesheet> => {
  const response = await api.put(`/timesheets/${id}`, data);
  return response.data;
};

export const deleteTimesheet = async (id: string): Promise<void> => {
  await api.delete(`/timesheets/${id}`);
};

export const submitTimesheet = async (id: string, data?: SubmitTimesheetData): Promise<Timesheet> => {
  const response = await api.post(`/timesheets/${id}/submit`, data || {});
  return response.data;
};

export const updateTimesheetStatus = async (id: string, data: UpdateTimesheetStatusData): Promise<Timesheet> => {
  const response = await api.put(`/timesheets/${id}/status`, data);
  return response.data;
};

export const getTimesheetSummary = async (params?: TimesheetSummaryParams): Promise<TimesheetSummary> => {
  const response = await api.get("/timesheets/summary", { params });
  return response.data;
};

export const startTimer = async (data: StartTimerData) => {
  const response = await api.post("/timesheets/timer/start", data);
  return response.data;
};

export const stopTimer = async (data?: StopTimerData) => {
  const response = await api.post("/timesheets/timer/stop", data || {});
  return response.data;
};

export const addManualTimeEntry = async (data: ManualTimeEntryData) => {
  const response = await api.post("/timesheets/manual-entry", data);
  return response.data;
};

// Helper functions
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "SUBMITTED":
      return "bg-yellow-100 text-yellow-800";
    case "DRAFT":
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case "APPROVED":
      return "✓";
    case "REJECTED":
      return "✗";
    case "SUBMITTED":
      return "⏳";
    case "DRAFT":
    default:
      return "📝";
  }
};
