import { z } from "zod";

export const EmpStatusEnum = z.enum(["ACTIVE","INACTIVE","ON_LEAVE"]);

export const CreateEmployeeDto = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")), // Date string (YYYY-MM-DD or ISO)
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  emergencyContact: z.string().max(200).optional().or(z.literal("")),
  designation: z.string().max(120).optional().or(z.literal("")),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"]).optional().or(z.literal("")),
  educationLevel: z.enum(["GRADE_8", "GRADE_10", "GRADE_12", "DEGREE", "MASTER", "PHD", "OTHER"]).optional().or(z.literal("")),
  educationOther: z.string().max(200).optional().or(z.literal("")),
  marriageStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().or(z.literal("")),
  document: z.string().optional().or(z.literal("")),
  status: EmpStatusEnum.default("ACTIVE"),
  joiningDate: z.string().optional().or(z.literal("")), // Date string (YYYY-MM-DD or ISO)
  salary: z.coerce.number().nonnegative().optional(),
  departmentId: z.string().optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
});

export const UpdateEmployeeDto = CreateEmployeeDto.partial();

export const ListEmployeesQuery = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  status: EmpStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10),
});
