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
  educationField: z.string().max(200).optional().or(z.literal("")),
  marriageStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().or(z.literal("")),
  document: z.string().optional().or(z.literal("")),
  avatarUrl: z.string().min(1).optional().or(z.literal("")),
  status: EmpStatusEnum.default("ACTIVE"),
  joiningDate: z.string().optional().or(z.literal("")), // Date string (YYYY-MM-DD or ISO)
  salary: z.coerce.number().nonnegative().optional(),
  departmentId: z.string().optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
  createUserAccount: z.boolean().optional().default(false),
  userPassword: z.string().min(6).optional().or(z.literal("")),
  userRoleId: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (
    data.educationLevel &&
    ["DEGREE", "MASTER", "PHD"].includes(data.educationLevel) &&
    (!data.educationField || data.educationField.trim() === "")
  ) {
    ctx.addIssue({
      path: ["educationField"],
      code: z.ZodIssueCode.custom,
      message: "Please provide the specific field or major for the selected education level.",
    });
  }

  if (data.createUserAccount) {
    if (!data.userPassword || data.userPassword.trim().length < 6) {
      ctx.addIssue({
        path: ["userPassword"],
        code: z.ZodIssueCode.custom,
        message: "User password must be at least 6 characters long.",
      });
    }
    if (!data.userRoleId || data.userRoleId.trim() === "") {
      ctx.addIssue({
        path: ["userRoleId"],
        code: z.ZodIssueCode.custom,
        message: "Please select a role for the new user account.",
      });
    }
  }
});

export const UpdateEmployeeDto = CreateEmployeeDto.partial();

export const ListEmployeesQuery = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  status: EmpStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10),
});

export const IdCardCodeTypeEnum = z.enum(["QR", "BARCODE", "NONE"]);
export const IdCardSizeEnum = z.enum(["ID1", "ID2", "ID3", "CUSTOM"]);
export const IdCardLayoutEnum = z.enum(["PHOTO_LEFT", "PHOTO_RIGHT", "PHOTO_TOP"]);

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color like #111827");

export const IdCardTemplateSettingsSchema = z.object({
  size: IdCardSizeEnum.default("ID1"),
  customDimensions: z
    .object({
      width: z.number().min(240).max(1400),
      height: z.number().min(240).max(1400),
    })
    .optional(),
  background: z
    .object({
      type: z.enum(["color", "image"]).default("color"),
      value: z.string().default("#ffffff"),
    })
    .default({ type: "color", value: "#ffffff" }),
  border: z
    .object({
      width: z.number().min(0).max(24).default(2),
      color: colorSchema.default("#111827"),
      radius: z.number().min(0).max(60).default(18),
    })
    .default({ width: 2, color: "#111827", radius: 18 }),
  text: z
    .object({
      color: colorSchema.default("#111827"),
      fontFamily: z.string().default("Inter, sans-serif"),
      fontSize: z.number().min(10).max(32).default(14),
      headingSize: z.number().min(12).max(48).default(20),
    })
    .default({ color: "#111827", fontFamily: "Inter, sans-serif", fontSize: 14, headingSize: 20 }),
  layout: IdCardLayoutEnum.default("PHOTO_LEFT"),
  fieldVisibility: z
    .object({
      showEmployeeName: z.boolean().default(true),
      showJobTitle: z.boolean().default(true),
      showDepartment: z.boolean().default(true),
      showEmployeeCode: z.boolean().default(true),
      showPhoto: z.boolean().default(true),
      showCompanyLogo: z.boolean().default(true),
      showIssueDate: z.boolean().default(true),
      showExpiryDate: z.boolean().default(false),
      showBarcode: z.boolean().default(true),
      showSignature: z.boolean().default(false),
      showStamp: z.boolean().default(false),
    })
    .default({
      showEmployeeName: true,
      showJobTitle: true,
      showDepartment: true,
      showEmployeeCode: true,
      showPhoto: true,
      showCompanyLogo: true,
      showIssueDate: true,
      showExpiryDate: false,
      showBarcode: true,
      showSignature: false,
      showStamp: false,
    }),
  assets: z
    .object({
      logoUrl: z.string().optional(),
      signatureUrl: z.string().optional(),
      stampUrl: z.string().optional(),
      backgroundUrl: z.string().optional(),
    })
    .optional()
    .default({}),
  extraLines: z.array(z.string().max(80)).max(4).default([]),
  codeType: IdCardCodeTypeEnum.default("QR"),
  placement: z
    .object({
      photo: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
      content: z.object({ x: z.number(), y: z.number(), width: z.number() }).optional(),
    })
    .optional(),
});

export const CreateIdCardTemplateDto = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(200).optional().or(z.literal("")),
  settings: IdCardTemplateSettingsSchema,
  isDefault: z.boolean().optional().default(false),
});

export const UpdateIdCardTemplateDto = CreateIdCardTemplateDto.partial();

export const GenerateIdCardDto = z
  .object({
    templateId: z.string().optional(),
    issueDate: z.string().optional().or(z.literal("")),
    expiryDate: z.string().optional().or(z.literal("")),
    codeType: IdCardCodeTypeEnum.optional(),
    forceRegenerate: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expiryDate && data.issueDate) {
      const issue = new Date(data.issueDate);
      const expiry = new Date(data.expiryDate);
      if (issue.toString() !== "Invalid Date" && expiry.toString() !== "Invalid Date" && expiry < issue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiryDate"],
          message: "Expiry date must be after issue date",
        });
      }
    }
  });

export const BatchGenerateIdCardDto = z.object({
  templateId: z.string().min(1),
  employeeIds: z.array(z.string()).min(1),
  issueDate: z.string().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
});

export type IdCardTemplateSettings = z.infer<typeof IdCardTemplateSettingsSchema>;
