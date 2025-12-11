import api from "./api";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";

export interface Attendance {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
<<<<<<< HEAD
=======
    email: string;
>>>>>>> dev
    employeeCode: string;
    designation?: string;
  };
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
<<<<<<< HEAD
=======
  checkInLocationInfo?: {
    type: string;
    displayName: string;
    isOffice: boolean;
    officeName?: string;
    distanceMeters?: number;
  } | null;
  checkOutLocationInfo?: {
    type: string;
    displayName: string;
    isOffice: boolean;
    officeName?: string;
    distanceMeters?: number;
  } | null;
>>>>>>> dev
  status: AttendanceStatus;
  workHours?: number;
  breakMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  halfDays: number;
  onLeaveDays: number;
  totalWorkHours: number;
}

export interface ListAttendanceParams {
  employeeId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  status?: AttendanceStatus;
<<<<<<< HEAD
  page?: number;
  pageSize?: number;
=======
  search?: string; // Search by employee name or email
  sortBy?: "date" | "checkInTime" | "checkOutTime" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  allEmployees?: boolean; // If true, show all employees (for admins/HR/managers)
>>>>>>> dev
}

export interface ListAttendanceResponse {
  items: Attendance[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Check in for the day
 */
export async function checkIn(location: string): Promise<Attendance> {
  const response = await api.post("/attendance/check-in", { location });
  return response.data;
}

/**
 * Check out for the day
 */
export async function checkOut(location: string): Promise<Attendance> {
  const response = await api.post("/attendance/check-out", { location });
  return response.data;
}

/**
 * Get today's attendance status
 */
export async function getTodayStatus(): Promise<Attendance | null> {
  const response = await api.get("/attendance/today");
  return response.data;
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(): Promise<AttendanceStats> {
  const response = await api.get("/attendance/stats");
  return response.data;
}

/**
 * List attendance records
 */
export async function listAttendance(params: ListAttendanceParams = {}): Promise<ListAttendanceResponse> {
  const response = await api.get("/attendance", { params });
  return response.data;
}

/**
<<<<<<< HEAD
=======
 * Create attendance record (for HR/Admin)
 */
export async function createAttendanceRecord(data: {
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // ISO datetime string
  checkOutTime?: string; // ISO datetime string
  checkInLocation?: string;
  checkOutLocation?: string;
  status?: AttendanceStatus;
  notes?: string;
}): Promise<Attendance> {
  const response = await api.post("/attendance", data);
  return response.data;
}

/**
>>>>>>> dev
 * Update attendance record (for HR/Admin)
 */
export async function updateAttendance(
  id: string,
  data: {
    status?: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
<<<<<<< HEAD
=======
    checkInLocation?: string;
    checkOutLocation?: string;
>>>>>>> dev
    notes?: string;
  }
): Promise<Attendance> {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(id: string): Promise<void> {
  await api.delete(`/attendance/${id}`);
}

