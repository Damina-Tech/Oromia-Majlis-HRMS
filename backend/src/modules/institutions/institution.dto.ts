import { z } from "zod";
import { InstitutionType, InstitutionStatus, OwnershipStatus, InstitutionRole, AssignmentStatus } from "@prisma/client";

// Geographic hierarchy DTOs
export const CreateRegionDto = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
});

export const CreateZoneDto = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  regionId: z.string(),
});

export const CreateWoredaDto = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  zoneId: z.string(),
});

export const CreateKebeleDto = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  woredaId: z.string(),
});

// Institution DTOs
export const MosqueDataSchema = z.object({
  capacity: z.number().int().positive().optional(),
  jummahAvailable: z.boolean().optional(),
  womenPrayerSpace: z.boolean().optional(),
  utilities: z.object({
    water: z.boolean().optional(),
    electricity: z.boolean().optional(),
  }).optional(),
});

export const MadrasahDataSchema = z.object({
  curriculumType: z.enum(["INTEGRATED"]),
  gradeLevels: z.array(z.enum(["PRIMARY", "SECONDARY", "PREPARATORY"])),
  accreditationStatus: z.enum(["ACCREDITED", "PROVISIONALLY_ACCREDITED", "NOT_ACCREDITED"]),
  students: z.object({
    male: z.number().int().min(0).optional(),
    female: z.number().int().min(0).optional(),
  }).optional(),
  teachers: z.object({
    islamic: z.number().int().min(0).optional(),
    science: z.number().int().min(0).optional(),
  }).optional(),
  classrooms: z.number().int().min(0).optional(),
  hasLabs: z.boolean().optional(),
  hasLibrary: z.boolean().optional(),
});

export const MarkazDataSchema = z.object({
  disciplines: z.array(z.enum(["QURAN", "HADITH", "TAFSIR", "FIQH", "AQEEDAH", "TARBIYA", "ARABIC"])),
  studyLevels: z.array(z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])),
  daawahActivities: z.boolean().optional(),
  students: z.number().int().min(0).optional(),
  scholars: z.number().int().min(0).optional(),
  hasBoarding: z.boolean().optional(),
  hasLibrary: z.boolean().optional(),
});

export const CreateInstitutionDto = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(InstitutionType),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  kebeleId: z.string().optional(),
  kebeleName: z.string().optional(), // Manual kebele name (free text)
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  yearEstablished: z.number().int().min(1000).max(2100).optional(),
  ownershipStatus: z.nativeEnum(OwnershipStatus).optional(),
  mosqueData: MosqueDataSchema.optional(),
  madrasahData: MadrasahDataSchema.optional(),
  markazData: MarkazDataSchema.optional(),
});

export const UpdateInstitutionDto = CreateInstitutionDto.partial().extend({
  status: z.nativeEnum(InstitutionStatus).optional(),
});

export const ApproveInstitutionDto = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

// Assignment DTOs
export const CreateAssignmentDto = z.object({
  employeeId: z.string(),
  institutionId: z.string(),
  role: z.nativeEnum(InstitutionRole),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const UpdateAssignmentDto = z.object({
  role: z.nativeEnum(InstitutionRole).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
});

export const ApproveAssignmentDto = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

// Query DTOs
export const ListInstitutionsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
  type: z.nativeEnum(InstitutionType).optional(),
  status: z.nativeEnum(InstitutionStatus).optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  search: z.string().optional(),
});

export const ListAssignmentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
  employeeId: z.string().optional(),
  institutionId: z.string().optional(),
  role: z.nativeEnum(InstitutionRole).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

// Type exports
export type CreateRegionInput = z.infer<typeof CreateRegionDto>;
export type CreateZoneInput = z.infer<typeof CreateZoneDto>;
export type CreateWoredaInput = z.infer<typeof CreateWoredaDto>;
export type CreateKebeleInput = z.infer<typeof CreateKebeleDto>;
export type CreateInstitutionInput = z.infer<typeof CreateInstitutionDto>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionDto>;
export type ApproveInstitutionInput = z.infer<typeof ApproveInstitutionDto>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentDto>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentDto>;
export type ApproveAssignmentInput = z.infer<typeof ApproveAssignmentDto>;
export type ListInstitutionsQueryInput = z.infer<typeof ListInstitutionsQuery>;
export type ListAssignmentsQueryInput = z.infer<typeof ListAssignmentsQuery>;

