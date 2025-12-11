import { z } from "zod";
export declare const AssetStatusSchema: z.ZodEnum<{
    IN_STOCK: "IN_STOCK";
    ASSIGNED: "ASSIGNED";
    IN_MAINTENANCE: "IN_MAINTENANCE";
    DISPOSED: "DISPOSED";
}>;
export declare const AssetConditionSchema: z.ZodEnum<{
    NEW: "NEW";
    GOOD: "GOOD";
    NEEDS_REPAIR: "NEEDS_REPAIR";
    RETIRED: "RETIRED";
}>;
export declare const AssetLocationTypeSchema: z.ZodEnum<{
    OFFICE: "OFFICE";
    STORE: "STORE";
    BRANCH: "BRANCH";
}>;
export declare const AssetMaintenanceTypeSchema: z.ZodEnum<{
    PREVENTIVE: "PREVENTIVE";
    CORRECTIVE: "CORRECTIVE";
}>;
export declare const AssetMaintenanceStatusSchema: z.ZodEnum<{
    CANCELLED: "CANCELLED";
    COMPLETED: "COMPLETED";
    SCHEDULED: "SCHEDULED";
    IN_PROGRESS: "IN_PROGRESS";
}>;
export declare const AssetDisposalMethodSchema: z.ZodEnum<{
    OTHER: "OTHER";
    SALE: "SALE";
    DONATION: "DONATION";
    SCRAP: "SCRAP";
    TRANSFER: "TRANSFER";
}>;
export declare const AssetDepreciationMethodSchema: z.ZodEnum<{
    STRAIGHT_LINE: "STRAIGHT_LINE";
    DECLINING_BALANCE: "DECLINING_BALANCE";
}>;
export declare const AssetHistoryActionSchema: z.ZodEnum<{
    ASSIGNED: "ASSIGNED";
    DISPOSED: "DISPOSED";
    RETIRED: "RETIRED";
    CREATED: "CREATED";
    REVOKED: "REVOKED";
    TRANSFERRED: "TRANSFERRED";
    MAINTENANCE_STARTED: "MAINTENANCE_STARTED";
    MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED";
    STATUS_CHANGED: "STATUS_CHANGED";
    CONDITION_UPDATED: "CONDITION_UPDATED";
}>;
export declare const CreateAssetCategoryDto: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetCategoryDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateAssetLocationDto: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        OFFICE: "OFFICE";
        STORE: "STORE";
        BRANCH: "BRANCH";
    }>;
}, z.core.$strip>;
export declare const UpdateAssetLocationDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        OFFICE: "OFFICE";
        STORE: "STORE";
        BRANCH: "BRANCH";
    }>>;
}, z.core.$strip>;
export declare const CreateAssetVendorDto: z.ZodObject<{
    name: z.ZodString;
    contact: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetVendorDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateAssetDto: z.ZodObject<{
    name: z.ZodString;
    categoryId: z.ZodString;
    brand: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    purchasePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    currency: z.ZodDefault<z.ZodString>;
    vendorId: z.ZodOptional<z.ZodString>;
    warrantyUntil: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    condition: z.ZodDefault<z.ZodEnum<{
        NEW: "NEW";
        GOOD: "GOOD";
        NEEDS_REPAIR: "NEEDS_REPAIR";
        RETIRED: "RETIRED";
    }>>;
    depreciationMethod: z.ZodOptional<z.ZodEnum<{
        STRAIGHT_LINE: "STRAIGHT_LINE";
        DECLINING_BALANCE: "DECLINING_BALANCE";
    }>>;
    depreciationRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    lifeYears: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    purchasePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    currency: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodOptional<z.ZodString>;
    warrantyUntil: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    condition: z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        GOOD: "GOOD";
        NEEDS_REPAIR: "NEEDS_REPAIR";
        RETIRED: "RETIRED";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        IN_STOCK: "IN_STOCK";
        ASSIGNED: "ASSIGNED";
        IN_MAINTENANCE: "IN_MAINTENANCE";
        DISPOSED: "DISPOSED";
    }>>;
    depreciationMethod: z.ZodOptional<z.ZodEnum<{
        STRAIGHT_LINE: "STRAIGHT_LINE";
        DECLINING_BALANCE: "DECLINING_BALANCE";
    }>>;
    depreciationRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    lifeYears: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssignAssetDto: z.ZodObject<{
    employeeId: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ReturnAssetDto: z.ZodObject<{
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateAssetMaintenanceDto: z.ZodObject<{
    date: z.ZodString;
    type: z.ZodEnum<{
        PREVENTIVE: "PREVENTIVE";
        CORRECTIVE: "CORRECTIVE";
    }>;
    vendorId: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    performedBy: z.ZodOptional<z.ZodString>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateAssetMaintenanceDto: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        PREVENTIVE: "PREVENTIVE";
        CORRECTIVE: "CORRECTIVE";
    }>>;
    vendorId: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    performedBy: z.ZodOptional<z.ZodString>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateAssetDisposalDto: z.ZodObject<{
    disposalDate: z.ZodString;
    method: z.ZodEnum<{
        OTHER: "OTHER";
        SALE: "SALE";
        DONATION: "DONATION";
        SCRAP: "SCRAP";
        TRANSFER: "TRANSFER";
    }>;
    saleAmount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RunDepreciationDto: z.ZodObject<{
    year: z.ZodCoercedNumber<unknown>;
    month: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const ListAssetsQuery: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        IN_STOCK: "IN_STOCK";
        ASSIGNED: "ASSIGNED";
        IN_MAINTENANCE: "IN_MAINTENANCE";
        DISPOSED: "DISPOSED";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        GOOD: "GOOD";
        NEEDS_REPAIR: "NEEDS_REPAIR";
        RETIRED: "RETIRED";
    }>>;
    locationId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    assignedToEmployeeId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        status: "status";
        createdAt: "createdAt";
        name: "name";
        categoryId: "categoryId";
        purchaseDate: "purchaseDate";
        condition: "condition";
        assetCode: "assetCode";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
}, z.core.$strip>;
export declare const AssetStatsQuery: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssetHistoryQuery: z.ZodObject<{
    assetId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodEnum<{
        ASSIGNED: "ASSIGNED";
        DISPOSED: "DISPOSED";
        RETIRED: "RETIRED";
        CREATED: "CREATED";
        REVOKED: "REVOKED";
        TRANSFERRED: "TRANSFERRED";
        MAINTENANCE_STARTED: "MAINTENANCE_STARTED";
        MAINTENANCE_COMPLETED: "MAINTENANCE_COMPLETED";
        STATUS_CHANGED: "STATUS_CHANGED";
        CONDITION_UPDATED: "CONDITION_UPDATED";
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
        IN_STOCK: "IN_STOCK";
        ASSIGNED: "ASSIGNED";
        IN_MAINTENANCE: "IN_MAINTENANCE";
        DISPOSED: "DISPOSED";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        GOOD: "GOOD";
        NEEDS_REPAIR: "NEEDS_REPAIR";
        RETIRED: "RETIRED";
    }>>;
    locationId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateAssetDto = z.infer<typeof CreateAssetDto>;
export type UpdateAssetDto = z.infer<typeof UpdateAssetDto>;
export type AssignAssetDto = z.infer<typeof AssignAssetDto>;
export type ReturnAssetDto = z.infer<typeof ReturnAssetDto>;
export type CreateAssetCategoryDto = z.infer<typeof CreateAssetCategoryDto>;
export type UpdateAssetCategoryDto = z.infer<typeof UpdateAssetCategoryDto>;
export type CreateAssetLocationDto = z.infer<typeof CreateAssetLocationDto>;
export type UpdateAssetLocationDto = z.infer<typeof UpdateAssetLocationDto>;
export type CreateAssetVendorDto = z.infer<typeof CreateAssetVendorDto>;
export type UpdateAssetVendorDto = z.infer<typeof UpdateAssetVendorDto>;
export type CreateAssetMaintenanceDto = z.infer<typeof CreateAssetMaintenanceDto>;
export type UpdateAssetMaintenanceDto = z.infer<typeof UpdateAssetMaintenanceDto>;
export type CreateAssetDisposalDto = z.infer<typeof CreateAssetDisposalDto>;
export type RunDepreciationDto = z.infer<typeof RunDepreciationDto>;
export type ListAssetsQuery = z.infer<typeof ListAssetsQuery>;
export type AssetStatsQuery = z.infer<typeof AssetStatsQuery>;
export type AssetHistoryQuery = z.infer<typeof AssetHistoryQuery>;
export type BulkUpdateAssetsDto = z.infer<typeof BulkUpdateAssetsDto>;
export type AssetStatus = z.infer<typeof AssetStatusSchema>;
export type AssetCondition = z.infer<typeof AssetConditionSchema>;
export type AssetLocationType = z.infer<typeof AssetLocationTypeSchema>;
export type AssetMaintenanceType = z.infer<typeof AssetMaintenanceTypeSchema>;
export type AssetMaintenanceStatus = z.infer<typeof AssetMaintenanceStatusSchema>;
export type AssetDisposalMethod = z.infer<typeof AssetDisposalMethodSchema>;
export type AssetDepreciationMethod = z.infer<typeof AssetDepreciationMethodSchema>;
export type AssetHistoryAction = z.infer<typeof AssetHistoryActionSchema>;
//# sourceMappingURL=asset.dto.d.ts.map