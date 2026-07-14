import { z } from "zod";
import { HalalBusinessCategory, HalalApplicationStatus, HalalBusinessStatus } from "@prisma/client";

export const HalalOwnerManagerPersonDto = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  nationalId: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  homeAddress: z.string().optional(),
  role: z.string().optional(),
});

const HalalBusinessCreateBody = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(HalalBusinessCategory),
  categoryOther: z.string().max(400).optional(),
  contactName: z.string().optional(),
  contactEmail: z.union([z.string().email(), z.literal("")]).optional(),
  contactPhone: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  woredaId: z.string().optional(),
  kebeleName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  ownerNationalId: z.string().optional(),
  ownerGender: z.string().optional(),
  ownerDateOfBirth: z.string().optional(),
  ownerHomeAddress: z.string().optional(),
  ownerRole: z.string().optional(),
  brandName: z.string().optional(),
  yearEstablished: z.coerce.number().optional(),
  businessType: z.string().optional(),
  tinNumber: z.string().optional(),
  productionSystem: z
    .object({
      totalCompanyAreaSqKm: z.number().positive(),
      productionAreaSqKm: z.number().positive(),
      numProductionLines: z.number().int().min(1),
      numShifts: z.number().int().min(1),
      numEmployees: z.number().int().min(1),
    })
    .refine((d) => d.productionAreaSqKm <= d.totalCompanyAreaSqKm, {
      message: "Production area cannot exceed total company area",
      path: ["productionAreaSqKm"],
    })
    .optional(),
  declarationSignature: z.string().optional(),
  declarationChecklist: z.object({
    noAlcohol: z.boolean(),
    noProhibited: z.boolean(),
    majlisCompliance: z.boolean(),
    dataAccurate: z.boolean(),
  }).optional(),
  productList: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string().optional(),
  })).optional(),
  ownersManagers: z.array(HalalOwnerManagerPersonDto).min(1).optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.union([z.string().email(), z.literal("")]).optional(),
  businessWebsite: z.string().max(512).optional(),
});

export const CreateHalalBusinessDto = HalalBusinessCreateBody.superRefine((data, ctx) => {
  if (data.category === HalalBusinessCategory.OTHER && !data.categoryOther?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Please describe the business category",
      path: ["categoryOther"],
    });
  }
  const hasOwners = data.ownersManagers && data.ownersManagers.length > 0;
  if (hasOwners) return;
  if (!data.contactName?.trim()) {
    ctx.addIssue({ code: "custom", message: "Contact name is required", path: ["contactName"] });
  }
  if (!data.contactEmail?.trim()) {
    ctx.addIssue({ code: "custom", message: "Contact email is required", path: ["contactEmail"] });
  } else {
    const r = z.string().email().safeParse(data.contactEmail);
    if (!r.success) ctx.addIssue({ code: "custom", message: "Invalid email", path: ["contactEmail"] });
  }
  if (!data.contactPhone?.trim()) {
    ctx.addIssue({ code: "custom", message: "Contact phone is required", path: ["contactPhone"] });
  }
});

export const UpdateHalalBusinessDto = HalalBusinessCreateBody.partial();

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

export const ManualPaymentDto = z.object({
  bankName: z.string().min(1, "Bank name is required"),
});

/** After certification fee payment: link at least two issued Halal competency certificates before business certificate issuance. */
export const SubmitHalalApplicationCompetencyWorkersDto = z.object({
  competencyCertificateIds: z.array(z.string().min(1)).min(2).max(40),
});

export const HalalApplicationCompetencyWorkerProposalEntryDto = z.object({
  fullName: z.string().trim().min(2).max(200),
  dateOfBirth: z.string().trim().min(1),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(200),
  jobTitle: z.string().trim().max(200).optional(),
  uploadedCertificateUrl: z.string().trim().min(1).max(500),
});

export const SubmitHalalApplicationCompetencyWorkerProposalsDto = z.object({
  workers: z.array(HalalApplicationCompetencyWorkerProposalEntryDto).min(1).max(20),
});

export const RejectHalalApplicationCompetencyWorkerProposalDto = z.object({
  reason: z.string().trim().min(10, "Please provide a reason (at least 10 characters)").max(2000),
});

export const PauseHalalApplicationDto = z.object({
  reason: z.string().trim().min(10, "Please provide a reason (at least 10 characters)").max(4000),
});

export const RejectHalalManualPaymentDto = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please explain why the receipt is rejected (at least 10 characters)")
    .max(2000),
});

export const AssignInspectionAssignmentEntryDto = z.object({
  inspectorId: z.string().min(1),
  expertRole: z.enum(["TECHNICAL_EXPERT", "SHARIA_EXPERT"]),
});

export const AssignInspectionDto = z
  .object({
    applicationId: z.string(),
    inspectorId: z.string().optional(),
    inspectorIds: z.array(z.string().min(1)).optional(),
    assignments: z.array(AssignInspectionAssignmentEntryDto).optional(),
    scheduledAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAssignments = Array.isArray(data.assignments) && data.assignments.length > 0;
    const legacyIds = [
      ...(data.inspectorId ? [data.inspectorId] : []),
      ...(data.inspectorIds ?? []),
    ];
    const hasLegacy = legacyIds.length > 0;

    if (hasAssignments && hasLegacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either assignments or inspectorId / inspectorIds, not both.",
        path: ["assignments"],
      });
      return;
    }
    if (hasAssignments) {
      const a = data.assignments!;
      if (a.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least two inspectors must be assigned.",
          path: ["assignments"],
        });
      }
      if (!a.some((x) => x.expertRole === "TECHNICAL_EXPERT")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one Technical Expert is required.",
          path: ["assignments"],
        });
      }
      const ids = a.map((x) => x.inspectorId);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each inspector may only be assigned once.",
          path: ["assignments"],
        });
      }
      return;
    }
    if (!hasLegacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide assignments (recommended) or at least one inspectorId / inspectorIds.",
        path: ["assignments"],
      });
    }
  });

export const CompleteInspectionDto = z.object({
  checklistData: z.record(z.string(), z.unknown()).optional(),
  evidence: z.array(z.object({
    url: z.string(),
    type: z.enum(["photo", "video"]),
  })).optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  digitalSignature: z.string().optional(),
  notes: z.string().optional(),
});

/** Business owner response to a completed inspection non-conformity report */
export const OwnerInspectionEvidenceDto = z.object({
  evidenceReportUrl: z.string().min(1, "Evidence report URL is required"),
  evidenceReportFileName: z.string().optional(),
});

export const UpdateInspectionAssignmentDto = z.object({
  inspectorId: z.string().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const ApproveApplicationDto = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  meetingMinutesUrl: z.string().optional(),
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
  limit: z.coerce.number().min(1).max(500).default(20),
  category: z.nativeEnum(HalalBusinessCategory).optional(),
  search: z.string().optional(),
  regionId: z.string().optional(),
  status: z.nativeEnum(HalalBusinessStatus).optional(),
  /** When true, returns approved Halal businesses for competency employer selection (not limited to owner). */
  employerDirectory: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const ListHalalApplicationsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  status: z.nativeEnum(HalalApplicationStatus).optional(),
  businessId: z.string().optional(),
  search: z.string().optional(),
});

export const ListHalalInspectionsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  inspectorId: z.string().optional(),
  applicationId: z.string().optional(),
  completed: z.enum(["true", "false"]).optional(),
});

export const ListHalalViolationsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  certificateId: z.string().optional(),
});

const halalProductDateField = z
  .string()
  .min(1, "Date is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const CreateHalalProductCertificateDto = z.object({
  halalCertificateId: z.string().min(1),
  productName: z.string().min(1, "Product name is required"),
  consignmentPcs: z.string().min(1, "Consignment details (PCS) are required"),
  netWeightKg: z.string().min(1, "Net weight is required"),
  grossWeightKg: z.string().min(1, "Gross weight is required"),
  shipping: z.string().min(1, "Shipping is required"),
  voyageFlightNo: z.string().min(1, "Voyage / flight number is required"),
  loadingPort: z.string().min(1, "Loading port is required").default("Addis Ababa Airport"),
  destination: z.string().min(1, "Destination is required"),
  slaughteringDate: halalProductDateField,
  productionDate: halalProductDateField,
  expiryDate: halalProductDateField,
  healthCertificateNo: z.string().min(1, "Health certificate number is required"),
  slaughteringCertificate: z.string().min(1, "Slaughtering certificate is required"),
  authorizedRepresentative: z.string().min(1, "Authorized representative is required"),
  notes: z.string().optional(),
});

export const ListHalalProductCertificatesQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  businessId: z.string().optional(),
});

const competencyStatuses = [
  "DRAFT",
  "SUBMITTED",
  "THEORETICAL_SCHEDULED",
  "THEORETICAL_PASSED",
  "THEORETICAL_FAILED",
  "TECHNICAL_SCHEDULED",
  "TECHNICAL_PASSED",
  "TECHNICAL_FAILED",
  "PAYMENT_PENDING",
  "ISSUED",
  "CANCELLED",
] as const;

export const HalalCompetencyReligiousAnswersDto = z.object({
  religionConfirmedMuslim: z.boolean().refine((v) => v === true, {
    message: "You must confirm that you are Muslim to apply",
  }),
  dailyPrayer: z.boolean(),
  observesRamadanFasting: z.boolean(),
  understandsTasmiyah: z.boolean(),
  familiarHalalVsHaramAnimals: z.boolean(),
  understandsProperSlaughterMethod: z.boolean(),
  knowledgeAnimalAliveHealthy: z.boolean(),
  knowledgeCorrectCuttingTechnique: z.boolean(),
  knowledgeCompleteBloodDrainage: z.boolean(),
});

export const CreateHalalCompetencyDto = z.object({
  fullName: z.string().min(1).max(200),
  dateOfBirth: z.string().min(1),
  phone: z.string().min(5).max(50),
  email: z.string().email(),
  employerName: z.string().min(1).max(300),
  jobTitle: z.string().max(200).optional(),
  religiousAnswers: HalalCompetencyReligiousAnswersDto,
  supportLetterUrl: z.string().min(1).optional(),
});

export const UpdateHalalCompetencyDto = z.object({
  fullName: z.string().min(1).max(200).optional(),
  dateOfBirth: z.string().min(1).optional(),
  phone: z.string().min(5).max(50).optional(),
  email: z.string().email().optional(),
  employerName: z.string().min(1).max(300).optional(),
  jobTitle: z.string().max(200).optional(),
  religiousAnswers: HalalCompetencyReligiousAnswersDto.optional(),
  supportLetterUrl: z.string().min(1).optional(),
});

export const ScheduleHalalCompetencyInterviewDto = z.object({
  scheduledAt: z.string().min(1),
});

export const RecordHalalCompetencyInterviewDto = z.object({
  passed: z.boolean(),
  notes: z.string().max(4000).optional(),
});

export const HALAL_COMPETENCY_FEE = 1000;

export const ListHalalCompetencyQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  status: z.enum(competencyStatuses).optional(),
});
