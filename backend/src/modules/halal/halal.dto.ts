import { z } from "zod";
import { HalalBusinessCategory, HalalApplicationStatus } from "@prisma/client";

export const CreateHalalBusinessDto = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(HalalBusinessCategory),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  kebeleName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});

export const UpdateHalalBusinessDto = CreateHalalBusinessDto.partial();

export const CreateHalalApplicationDto = z.object({
  businessId: z.string(),
  productList: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    source: z.string().optional(),
    halalStatus: z.string().optional(),
  })).optional(),
  supplierInfo: z.array(z.object({
    name: z.string(),
    certification: z.string().optional(),
  })).optional(),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string().optional(),
  })).optional(),
});

export const UpdateHalalApplicationDto = z.object({
  status: z.nativeEnum(HalalApplicationStatus).optional(),
  productList: CreateHalalApplicationDto.shape.productList.optional(),
  ingredients: CreateHalalApplicationDto.shape.ingredients.optional(),
  supplierInfo: CreateHalalApplicationDto.shape.supplierInfo.optional(),
  documents: CreateHalalApplicationDto.shape.documents.optional(),
  rejectionReason: z.string().optional(),
});

export const SubmitHalalApplicationDto = z.object({});

export const AssignInspectionDto = z.object({
  applicationId: z.string(),
  inspectorId: z.string(),
  scheduledAt: z.string().datetime().optional(),
});

export const CompleteInspectionDto = z.object({
  checklistData: z.record(z.any()).optional(),
  evidence: z.array(z.object({
    url: z.string(),
    type: z.enum(["photo", "video"]),
  })).optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  digitalSignature: z.string().optional(),
  notes: z.string().optional(),
});

export const ApproveApplicationDto = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const CreateRenewalDto = z.object({
  certificateId: z.string(), // Prisma id or HAL-YYYY-NNNN
  newExpiry: z.string().datetime(),
});

export const CreateViolationDto = z.object({
  certificateId: z.string(),
  description: z.string().min(1),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  action: z.enum(["WARNING", "SUSPENSION", "REVOCATION"]).optional(),
});

export const ListHalalBusinessesQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.nativeEnum(HalalBusinessCategory).optional(),
  search: z.string().optional(),
  regionId: z.string().optional(),
});

export const ListHalalApplicationsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(HalalApplicationStatus).optional(),
  businessId: z.string().optional(),
  search: z.string().optional(),
});

export const ListHalalInspectionsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  inspectorId: z.string().optional(),
  applicationId: z.string().optional(),
  completed: z.enum(["true", "false"]).optional(),
});
