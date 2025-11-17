import { z } from "zod";

// Asset Status
export const AssetStatusSchema = z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST", "DAMAGED"]);

// Asset Condition
export const AssetConditionSchema = z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]);

// Asset Category
export const AssetCategorySchema = z.enum([
  "LAPTOP", "DESKTOP", "MONITOR", "KEYBOARD", "MOUSE", "PHONE", "TABLET", 
  "HEADSET", "PRINTER", "NETWORK_EQUIPMENT", "OTHER"
]);

// Asset History Action
export const AssetHistoryActionSchema = z.enum([
  "CREATED", "ASSIGNED", "REVOKED", "TRANSFERRED", "MAINTENANCE_STARTED", 
  "MAINTENANCE_COMPLETED", "STATUS_CHANGED", "CONDITION_UPDATED", "RETIRED", "LOST", "FOUND"
]);

// Create Asset DTO
export const CreateAssetDto = z.object({
  name: z.string().min(1, "Asset name is required").max(200, "Asset name too long"),
  category: AssetCategorySchema,
  serialNumber: z.string().min(1, "Serial number is required").max(100, "Serial number too long"),
  model: z.string().max(200, "Model name too long").optional(),
  brand: z.string().max(100, "Brand name too long").optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive").optional(),
  currentValue: z.coerce.number().min(0, "Current value must be positive").optional(),
  condition: AssetConditionSchema.optional(),
  location: z.string().max(200, "Location too long").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
});

// Update Asset DTO
export const UpdateAssetDto = z.object({
  name: z.string().min(1).max(200).optional(),
  category: AssetCategorySchema.optional(),
  serialNumber: z.string().min(1).max(100).optional(),
  model: z.string().max(200).optional(),
  brand: z.string().max(100).optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).optional(),
  condition: AssetConditionSchema.optional(),
  status: AssetStatusSchema.optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// Assign Asset DTO
export const AssignAssetDto = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().max(500, "Notes too long").optional(),
});

// Transfer Asset DTO
export const TransferAssetDto = z.object({
  toEmployeeId: z.string().min(1, "Target employee ID is required"),
  notes: z.string().max(500, "Notes too long").optional(),
});

// Update Asset Status DTO
export const UpdateAssetStatusDto = z.object({
  status: AssetStatusSchema,
  notes: z.string().max(500, "Notes too long").optional(),
});

// Update Asset Condition DTO
export const UpdateAssetConditionDto = z.object({
  condition: AssetConditionSchema,
  notes: z.string().max(500, "Notes too long").optional(),
});

// List Assets Query DTO
export const ListAssetsQuery = z.object({
  search: z.string().optional(),
  category: AssetCategorySchema.optional(),
  status: AssetStatusSchema.optional(),
  condition: AssetConditionSchema.optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
  sortBy: z.enum(["name", "serialNumber", "category", "status", "condition", "purchaseDate", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Asset Statistics Query DTO
export const AssetStatsQuery = z.object({
  category: AssetCategorySchema.optional(),
  location: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Asset History Query DTO
export const AssetHistoryQuery = z.object({
  assetId: z.string().optional(),
  action: AssetHistoryActionSchema.optional(),
  performedBy: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
});

// Bulk Operations DTO
export const BulkUpdateAssetsDto = z.object({
  assetIds: z.array(z.string()).min(1, "At least one asset ID is required"),
  status: AssetStatusSchema.optional(),
  condition: AssetConditionSchema.optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateAssetDto = z.infer<typeof CreateAssetDto>;
export type UpdateAssetDto = z.infer<typeof UpdateAssetDto>;
export type AssignAssetDto = z.infer<typeof AssignAssetDto>;
export type TransferAssetDto = z.infer<typeof TransferAssetDto>;
export type UpdateAssetStatusDto = z.infer<typeof UpdateAssetStatusDto>;
export type UpdateAssetConditionDto = z.infer<typeof UpdateAssetConditionDto>;
export type ListAssetsQuery = z.infer<typeof ListAssetsQuery>;
export type AssetStatsQuery = z.infer<typeof AssetStatsQuery>;
export type AssetHistoryQuery = z.infer<typeof AssetHistoryQuery>;
export type BulkUpdateAssetsDto = z.infer<typeof BulkUpdateAssetsDto>;
export type AssetStatus = z.infer<typeof AssetStatusSchema>;
export type AssetCondition = z.infer<typeof AssetConditionSchema>;
export type AssetCategory = z.infer<typeof AssetCategorySchema>;
export type AssetHistoryAction = z.infer<typeof AssetHistoryActionSchema>;
