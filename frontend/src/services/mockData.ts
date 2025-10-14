// Mock data for HRMS system

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  manager: string;
  salary: number;
  avatar?: string;
  address: string;
  emergencyContact: string;
  employeeId: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  description: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'casual' | 'sick' | 'vacation' | 'maternity' | 'personal';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  approver?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  location?: string;
  workHours?: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
}

export interface Asset {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'equipment' | 'software';
  serialNumber: string;
  assignedTo?: string;
  assignedDate?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  value: number;
}

export const mockEmployees: Employee[] = [
{
  id: '1',
  name: 'John Admin',
  email: 'admin@company.com',
  phone: '+1234567890',
  department: 'IT',
  designation: 'System Administrator',
  joiningDate: '2020-01-15',
  status: 'active',
  manager: '',
  salary: 75000,
  address: '123 Tech Street, Silicon Valley',
  emergencyContact: '+1234567891',
  employeeId: 'EMP001'
},
{
  id: '2',
  name: 'Sarah HR',
  email: 'hr@company.com',
  phone: '+1234567892',
  department: 'Human Resources',
  designation: 'HR Manager',
  joiningDate: '2019-03-20',
  status: 'active',
  manager: 'John Admin',
  salary: 65000,
  address: '456 Business Ave, Downtown',
  emergencyContact: '+1234567893',
  employeeId: 'EMP002'
},
{
  id: '3',
  name: 'Mike Manager',
  email: 'manager@company.com',
  phone: '+1234567894',
  department: 'Engineering',
  designation: 'Team Lead',
  joiningDate: '2018-07-10',
  status: 'active',
  manager: 'John Admin',
  salary: 85000,
  address: '789 Innovation Blvd, Tech Park',
  emergencyContact: '+1234567895',
  employeeId: 'EMP003'
},
{
  id: '4',
  name: 'Alice Employee',
  email: 'employee@company.com',
  phone: '+1234567896',
  department: 'Engineering',
  designation: 'Software Developer',
  joiningDate: '2021-02-01',
  status: 'active',
  manager: 'Mike Manager',
  salary: 70000,
  address: '321 Code Lane, Dev District',
  emergencyContact: '+1234567897',
  employeeId: 'EMP004'
},
{
  id: '5',
  name: 'Emma Designer',
  email: 'emma@company.com',
  phone: '+1234567898',
  department: 'Design',
  designation: 'UI/UX Designer',
  joiningDate: '2021-06-15',
  status: 'active',
  manager: 'Sarah HR',
  salary: 60000,
  address: '654 Creative Way, Art Quarter',
  emergencyContact: '+1234567899',
  employeeId: 'EMP005'
}];


export const mockDepartments: Department[] = [
{
  id: '1',
  name: 'Engineering',
  head: 'Mike Manager',
  employeeCount: 25,
  description: 'Software development and technical operations'
},
{
  id: '2',
  name: 'Human Resources',
  head: 'Sarah HR',
  employeeCount: 5,
  description: 'Employee relations and organizational development'
},
{
  id: '3',
  name: 'IT',
  head: 'John Admin',
  employeeCount: 8,
  description: 'Information technology and system administration'
},
{
  id: '4',
  name: 'Design',
  head: 'Emma Designer',
  employeeCount: 12,
  description: 'User experience and visual design'
},
{
  id: '5',
  name: 'Marketing',
  head: 'David Marketing',
  employeeCount: 10,
  description: 'Brand promotion and customer acquisition'
}];


export const mockLeaveRequests: LeaveRequest[] = [
{
  id: '1',
  employeeId: '4',
  employeeName: 'Alice Employee',
  type: 'vacation',
  startDate: '2024-12-20',
  endDate: '2024-12-25',
  days: 5,
  reason: 'Holiday vacation',
  status: 'pending',
  appliedDate: '2024-12-01'
},
{
  id: '2',
  employeeId: '5',
  employeeName: 'Emma Designer',
  type: 'sick',
  startDate: '2024-11-15',
  endDate: '2024-11-16',
  days: 2,
  reason: 'Flu symptoms',
  status: 'approved',
  appliedDate: '2024-11-14',
  approver: 'Sarah HR'
}];


export const mockAttendance: AttendanceRecord[] = [
{
  id: '1',
  employeeId: '4',
  date: '2024-12-01',
  checkIn: '09:00',
  checkOut: '18:00',
  status: 'present',
  location: 'Office',
  workHours: 9
},
{
  id: '2',
  employeeId: '4',
  date: '2024-12-02',
  checkIn: '09:15',
  checkOut: '18:30',
  status: 'late',
  location: 'Office',
  workHours: 9.25
}];


export const mockPayroll: PayrollRecord[] = [
{
  id: '1',
  employeeId: '4',
  employeeName: 'Alice Employee',
  month: 'November',
  year: 2024,
  basicSalary: 70000,
  allowances: 5000,
  deductions: 8000,
  netSalary: 67000,
  status: 'paid'
}];


export const mockAssets: Asset[] = [
{
  id: '1',
  name: 'MacBook Pro 16"',
  type: 'laptop',
  serialNumber: 'MBP2024001',
  assignedTo: 'Alice Employee',
  assignedDate: '2024-02-01',
  status: 'assigned',
  value: 2500
},
{
  id: '2',
  name: 'iPhone 14',
  type: 'mobile',
  serialNumber: 'IP14001',
  status: 'available',
  value: 800
}];