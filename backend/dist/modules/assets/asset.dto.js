import { z } from "zod";
// Enums matching Prisma schema
export const AssetStatusSchema = z.enum(["IN_STOCK", "ASSIGNED", "IN_MAINTENANCE", "DISPOSED"]);
export const AssetConditionSchema = z.enum(["NEW", "GOOD", "NEEDS_REPAIR", "RETIRED"]);
export const AssetLocationTypeSchema = z.enum(["STORE", "BRANCH", "OFFICE"]);
export const AssetMaintenanceTypeSchema = z.enum(["PREVENTIVE", "CORRECTIVE"]);
export const AssetMaintenanceStatusSchema = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const AssetDisposalMethodSchema = z.enum(["SALE", "DONATION", "SCRAP", "TRANSFER", "OTHER"]);
export const AssetDepreciationMethodSchema = z.enum(["STRAIGHT_LINE", "DECLINING_BALANCE"]);
export const AssetHistoryActionSchema = z.enum([
    "CREATED", "ASSIGNED", "REVOKED", "TRANSFERRED", "MAINTENANCE_STARTED",
    "MAINTENANCE_COMPLETED", "STATUS_CHANGED", "CONDITION_UPDATED", "RETIRED", "DISPOSED"
]);
// Asset Category DTOs
export const CreateAssetCategoryDto = z.object({
    name: z.string().min(1, "Category name is required").max(100),
    description: z.string().max(500).optional(),
});
export const UpdateAssetCategoryDto = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
});
// Asset Location DTOs
export const CreateAssetLocationDto = z.object({
    name: z.string().min(1, "Location name is required").max(100),
    address: z.string().max(500).optional(),
    type: AssetLocationTypeSchema,
});
export const UpdateAssetLocationDto = z.object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().max(500).optional(),
    type: AssetLocationTypeSchema.optional(),
});
// Asset Vendor DTOs
export const CreateAssetVendorDto = z.object({
    name: z.string().min(1, "Vendor name is required").max(100),
    contact: z.string().max(200).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().max(100).optional(),
});
export const UpdateAssetVendorDto = z.object({
    name: z.string().min(1).max(100).optional(),
    contact: z.string().max(200).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email().max(100).optional(),
});
// Create Asset DTO
export const CreateAssetDto = z.object({
    name: z.string().min(1, "Asset name is required").max(200),
    categoryId: z.string().min(1, "Category is required"),
    brand: z.string().max(100).optional(),
    model: z.string().max(200).optional(),
    serialNumber: z.string().max(100).optional(),
    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    purchasePrice: z.coerce.number().min(0, "Purchase price must be positive").optional(),
    currency: z.string().max(10).default("USD"),
    vendorId: z.string().optional(),
    warrantyUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    locationId: z.string().optional(),
    departmentId: z.string().optional(),
    condition: AssetConditionSchema.default("NEW"),
    depreciationMethod: AssetDepreciationMethodSchema.optional(),
    depreciationRate: z.coerce.number().min(0).max(100).optional(),
    lifeYears: z.coerce.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
});
// Update Asset DTO
export const UpdateAssetDto = z.object({
    name: z.string().min(1).max(200).optional(),
    categoryId: z.string().min(1).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(200).optional(),
    serialNumber: z.string().max(100).optional(),
    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    purchasePrice: z.coerce.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    vendorId: z.string().optional(),
    warrantyUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    locationId: z.string().optional(),
    departmentId: z.string().optional(),
    condition: AssetConditionSchema.optional(),
    status: AssetStatusSchema.optional(),
    depreciationMethod: AssetDepreciationMethodSchema.optional(),
    depreciationRate: z.coerce.number().min(0).max(100).optional(),
    lifeYears: z.coerce.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
});
// Assign Asset DTO
export const AssignAssetDto = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    note: z.string().max(500).optional(),
});
// Return Asset DTO
export const ReturnAssetDto = z.object({
    note: z.string().max(500).optional(),
});
// Asset Maintenance DTOs
export const CreateAssetMaintenanceDto = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    type: AssetMaintenanceTypeSchema,
    vendorId: z.string().optional(),
    cost: z.coerce.number().min(0).optional(),
    performedBy: z.string().optional(), // Employee ID
    nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: AssetMaintenanceStatusSchema.default("SCHEDULED"),
    notes: z.string().max(2000).optional(),
});
export const UpdateAssetMaintenanceDto = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    type: AssetMaintenanceTypeSchema.optional(),
    vendorId: z.string().optional(),
    cost: z.coerce.number().min(0).optional(),
    performedBy: z.string().optional(),
    nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: AssetMaintenanceStatusSchema.optional(),
    notes: z.string().max(2000).optional(),
});
// Asset Disposal DTO
export const CreateAssetDisposalDto = z.object({
    disposalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    method: AssetDisposalMethodSchema,
    saleAmount: z.coerce.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
});
// Asset Depreciation DTOs
export const RunDepreciationDto = z.object({
    year: z.coerce.number().int().min(2000).max(3000),
    month: z.coerce.number().int().min(1).max(12).optional(),
});
// List Assets Query DTO
export const ListAssetsQuery = z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    status: AssetStatusSchema.optional(),
    condition: AssetConditionSchema.optional(),
    locationId: z.string().optional(),
    departmentId: z.string().optional(),
    assignedToEmployeeId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(1000).default(50),
    sortBy: z.enum(["name", "assetCode", "categoryId", "status", "condition", "purchaseDate", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
// Asset Statistics Query DTO
export const AssetStatsQuery = z.object({
    categoryId: z.string().optional(),
    locationId: z.string().optional(),
    departmentId: z.string().optional(),
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
    locationId: z.string().optional(),
    notes: z.string().max(1000).optional(),
});
//# sourceMappingURL=asset.dto.js.map