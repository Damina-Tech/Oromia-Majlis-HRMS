import { z } from "zod";
export declare const AssetStatusSchema: z.ZodEnum<{
    AVAILABLE: "AVAILABLE";
    ASSIGNED: "ASSIGNED";
    MAINTENANCE: "MAINTENANCE";
    RETIRED: "RETIRED";
    LOST: "LOST";
    DAMAGED: "DAMAGED";
}>;
export declare const AssetConditionSchema: z.ZodEnum<{
    DAMAGED: "DAMAGED";
    EXCELLENT: "EXCELLENT";
    GOOD: "GOOD";
    FAIR: "FAIR";
    POOR: "POOR";
}>;
export declare const AssetCategorySchema: z.ZodEnum<{
    OTHER: "OTHER";
    LAPTOP: "LAPTOP";
    DESKTOP: "DESKTOP";
    MONITOR: "MONITOR";
    KEYBOARD: "KEYBOARD";
    MOUSE: "MOUSE";
    PHONE: "PHONE";
    TABLET: "TABLET";
    HEADSET: "HEADSET";
    PRINTER: "PRINTER";
    NETWORK_EQUIPMENT: "NETWORK_EQUIPMENT";
}>;
export declare const AssetHistoryActionSchema: z.ZodEnum<{
    ASSIGNED: "ASSIGNED";
    RETIRED: "RETIRED";
    LOST: "LOST";
    CREATED: "CREATED";
    REVOKED: "REVOKED";
    TRANSFERRED: "TRANSFERRED";
    MAINTENANCE_STARTED: "MAINTENANCE_STARTED";
    MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED";
    STATUS_CHANGED: "STATUS_CHANGED";
    CONDITION_UPDATED: "CONDITION_UPDATED";
    FOUND: "FOUND";
}>;
export declare const CreateAssetDto: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodEnum<{
        OTHER: "OTHER";
        LAPTOP: "LAPTOP";
        DESKTOP: "DESKTOP";
        MONITOR: "MONITOR";
        KEYBOARD: "KEYBOARD";
        MOUSE: "MOUSE";
        PHONE: "PHONE";
        TABLET: "TABLET";
        HEADSET: "HEADSET";
        PRINTER: "PRINTER";
        NETWORK_EQUIPMENT: "NETWORK_EQUIPMENT";
    }>;
    serialNumber: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    purchasePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    currentValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    condition: z.ZodOptional<z.ZodEnum<{
        DAMAGED: "DAMAGED";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        LAPTOP: "LAPTOP";
        DESKTOP: "DESKTOP";
        MONITOR: "MONITOR";
        KEYBOARD: "KEYBOARD";
        MOUSE: "MOUSE";
        PHONE: "PHONE";
        TABLET: "TABLET";
        HEADSET: "HEADSET";
        PRINTER: "PRINTER";
        NETWORK_EQUIPMENT: "NETWORK_EQUIPMENT";
    }>>;
    serialNumber: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    purchasePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    currentValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    condition: z.ZodOptional<z.ZodEnum<{
        DAMAGED: "DAMAGED";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        AVAILABLE: "AVAILABLE";
        ASSIGNED: "ASSIGNED";
        MAINTENANCE: "MAINTENANCE";
        RETIRED: "RETIRED";
        LOST: "LOST";
        DAMAGED: "DAMAGED";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssignAssetDto: z.ZodObject<{
    employeeId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TransferAssetDto: z.ZodObject<{
    toEmployeeId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetStatusDto: z.ZodObject<{
    status: z.ZodEnum<{
        AVAILABLE: "AVAILABLE";
        ASSIGNED: "ASSIGNED";
        MAINTENANCE: "MAINTENANCE";
        RETIRED: "RETIRED";
        LOST: "LOST";
        DAMAGED: "DAMAGED";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetConditionDto: z.ZodObject<{
    condition: z.ZodEnum<{
        DAMAGED: "DAMAGED";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ListAssetsQuery: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        LAPTOP: "LAPTOP";
        DESKTOP: "DESKTOP";
        MONITOR: "MONITOR";
        KEYBOARD: "KEYBOARD";
        MOUSE: "MOUSE";
        PHONE: "PHONE";
        TABLET: "TABLET";
        HEADSET: "HEADSET";
        PRINTER: "PRINTER";
        NETWORK_EQUIPMENT: "NETWORK_EQUIPMENT";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        AVAILABLE: "AVAILABLE";
        ASSIGNED: "ASSIGNED";
        MAINTENANCE: "MAINTENANCE";
        RETIRED: "RETIRED";
        LOST: "LOST";
        DAMAGED: "DAMAGED";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        DAMAGED: "DAMAGED";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodString>;
    assignedBy: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        status: "status";
        createdAt: "createdAt";
        name: "name";
        category: "category";
        serialNumber: "serialNumber";
        purchaseDate: "purchaseDate";
        condition: "condition";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
}, z.core.$strip>;
export declare const AssetStatsQuery: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        LAPTOP: "LAPTOP";
        DESKTOP: "DESKTOP";
        MONITOR: "MONITOR";
        KEYBOARD: "KEYBOARD";
        MOUSE: "MOUSE";
        PHONE: "PHONE";
        TABLET: "TABLET";
        HEADSET: "HEADSET";
        PRINTER: "PRINTER";
        NETWORK_EQUIPMENT: "NETWORK_EQUIPMENT";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssetHistoryQuery: z.ZodObject<{
    assetId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodEnum<{
        ASSIGNED: "ASSIGNED";
        RETIRED: "RETIRED";
        LOST: "LOST";
        CREATED: "CREATED";
        REVOKED: "REVOKED";
        TRANSFERRED: "TRANSFERRED";
        MAINTENANCE_STARTED: "MAINTENANCE_STARTED";
        MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED";
        STATUS_CHANGED: "STATUS_CHANGED";
        CONDITION_UPDATED: "CONDITION_UPDATED";
        FOUND: "FOUND";
    }>>;
    performedBy: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const BulkUpdateAssetsDto: z.ZodObject<{
    assetIds: z.ZodArray<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        AVAILABLE: "AVAILABLE";
        ASSIGNED: "ASSIGNED";
        MAINTENANCE: "MAINTENANCE";
        RETIRED: "RETIRED";
        LOST: "LOST";
        DAMAGED: "DAMAGED";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        DAMAGED: "DAMAGED";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
//# sourceMappingURL=asset.dto.d.ts.map