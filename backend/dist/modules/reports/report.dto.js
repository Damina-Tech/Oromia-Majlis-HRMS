import { z } from "zod";
// Report Module Enum
export const ReportModuleSchema = z.enum([
    "EMPLOYEES",
    "DEPARTMENTS",
    "LEAVES",
    "ATTENDANCE",
    "PAYROLL",
    "TASKS",
    "ASSETS",
    "EXPENSES",
    "DOCUMENTS",
    "TIMESHEETS",
]);
export const ReportTypeSchema = z.enum([
    "SUMMARY",
    "DETAILED",
    "COMPARATIVE",
    "TREND",
    "DISTRIBUTION",
]);
export const VisualizationTypeSchema = z.enum([
    "TABLE",
    "LINE_CHART",
    "BAR_CHART",
    "PIE_CHART",
    "HEATMAP",
]);
export const DateRangeSchema = z.enum([
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "LAST_30_DAYS",
    "LAST_90_DAYS",
    "THIS_YEAR",
    "CUSTOM",
]);
// Report Filter DTO
export const ReportFilterSchema = z.object({
    dateRange: DateRangeSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    departmentIds: z.array(z.string()).optional(),
    employeeIds: z.array(z.string()).optional(),
    roleIds: z.array(z.string()).optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // Module-specific filters
    leaveType: z.string().optional(),
    expenseType: z.string().optional(),
    assetCategory: z.string().optional(),
    taskStatus: z.string().optional(),
    taskPriority: z.string().optional(),
});
// Generate Report DTO
export const GenerateReportDtoSchema = z.object({
    templateId: z.string().optional(),
    module: ReportModuleSchema,
    reportType: ReportTypeSchema,
    filters: ReportFilterSchema,
    columns: z.array(z.string()).optional(),
    groupBy: z.array(z.string()).optional(),
    aggregations: z.record(z.string()).optional(), // e.g., { "amount": "sum", "count": "count" }
    visualization: VisualizationTypeSchema.optional(),
    saveAsTemplate: z.boolean().optional().default(false),
    templateName: z.string().optional(),
});
// List Reports Query
export const ListReportsQuerySchema = z.object({
    module: ReportModuleSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
});
// Report Template DTO
export const ReportTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    module: z.string(),
    reportType: z.string(),
    defaultFilters: ReportFilterSchema.optional(),
    defaultColumns: z.array(z.string()).optional(),
    defaultGroupBy: z.array(z.string()).optional(),
    defaultVisualization: VisualizationTypeSchema.optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    isSystem: z.boolean().default(false),
});
// Report Data Response
export const ReportDataSchema = z.object({
    data: z.array(z.record(z.any())),
    metadata: z.object({
        totalRows: z.number(),
        generatedAt: z.string(),
        filters: ReportFilterSchema.optional(),
        columns: z.array(z.string()).optional(),
        aggregations: z.record(z.any()).optional(),
    }),
});
// Report Audit Log DTO
export const ReportAuditLogSchema = z.object({
    id: z.string(),
    reportId: z.string().optional(),
    templateId: z.string().optional(),
    module: z.string(),
    reportType: z.string(),
    generatedBy: z.string(),
    generatedByUser: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
    }).optional(),
    filters: ReportFilterSchema.optional(),
    exportFormat: z.string().optional(), // "EXCEL", "PDF", "CSV"
    generatedAt: z.string(),
});
// List Audit Logs Query
export const ListAuditLogsQuerySchema = z.object({
    module: ReportModuleSchema.optional(),
    generatedBy: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
});
// Dashboard Widget DTO
export const DashboardWidgetSchema = z.object({
    id: z.string(),
    type: z.enum(["KPI", "CHART", "TABLE"]),
    title: z.string(),
    module: z.string(),
    config: z.record(z.any()),
    position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
    }).optional(),
});
// Save Dashboard Config DTO
export const SaveDashboardConfigDtoSchema = z.object({
    widgets: z.array(DashboardWidgetSchema),
});
//# sourceMappingURL=report.dto.js.map