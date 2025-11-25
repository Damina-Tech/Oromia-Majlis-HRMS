import { z } from "zod";
export declare const ReportModuleSchema: z.ZodEnum<{
    ATTENDANCE: "ATTENDANCE";
    PAYROLL: "PAYROLL";
    EMPLOYEES: "EMPLOYEES";
    DEPARTMENTS: "DEPARTMENTS";
    LEAVES: "LEAVES";
    TASKS: "TASKS";
    ASSETS: "ASSETS";
    EXPENSES: "EXPENSES";
    DOCUMENTS: "DOCUMENTS";
    TIMESHEETS: "TIMESHEETS";
}>;
export declare const ReportTypeSchema: z.ZodEnum<{
    SUMMARY: "SUMMARY";
    DETAILED: "DETAILED";
    COMPARATIVE: "COMPARATIVE";
    TREND: "TREND";
    DISTRIBUTION: "DISTRIBUTION";
}>;
export declare const VisualizationTypeSchema: z.ZodEnum<{
    TABLE: "TABLE";
    LINE_CHART: "LINE_CHART";
    BAR_CHART: "BAR_CHART";
    PIE_CHART: "PIE_CHART";
    HEATMAP: "HEATMAP";
}>;
export declare const DateRangeSchema: z.ZodEnum<{
    CUSTOM: "CUSTOM";
    TODAY: "TODAY";
    THIS_WEEK: "THIS_WEEK";
    THIS_MONTH: "THIS_MONTH";
    LAST_30_DAYS: "LAST_30_DAYS";
    LAST_90_DAYS: "LAST_90_DAYS";
    THIS_YEAR: "THIS_YEAR";
}>;
export declare const ReportFilterSchema: z.ZodObject<{
    dateRange: z.ZodOptional<z.ZodEnum<{
        CUSTOM: "CUSTOM";
        TODAY: "TODAY";
        THIS_WEEK: "THIS_WEEK";
        THIS_MONTH: "THIS_MONTH";
        LAST_30_DAYS: "LAST_30_DAYS";
        LAST_90_DAYS: "LAST_90_DAYS";
        THIS_YEAR: "THIS_YEAR";
    }>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    status: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    leaveType: z.ZodOptional<z.ZodString>;
    expenseType: z.ZodOptional<z.ZodString>;
    assetCategory: z.ZodOptional<z.ZodString>;
    taskStatus: z.ZodOptional<z.ZodString>;
    taskPriority: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const GenerateReportDtoSchema: z.ZodObject<{
    templateId: z.ZodOptional<z.ZodString>;
    module: z.ZodEnum<{
        ATTENDANCE: "ATTENDANCE";
        PAYROLL: "PAYROLL";
        EMPLOYEES: "EMPLOYEES";
        DEPARTMENTS: "DEPARTMENTS";
        LEAVES: "LEAVES";
        TASKS: "TASKS";
        ASSETS: "ASSETS";
        EXPENSES: "EXPENSES";
        DOCUMENTS: "DOCUMENTS";
        TIMESHEETS: "TIMESHEETS";
    }>;
    reportType: z.ZodEnum<{
        SUMMARY: "SUMMARY";
        DETAILED: "DETAILED";
        COMPARATIVE: "COMPARATIVE";
        TREND: "TREND";
        DISTRIBUTION: "DISTRIBUTION";
    }>;
    filters: z.ZodObject<{
        dateRange: z.ZodOptional<z.ZodEnum<{
            CUSTOM: "CUSTOM";
            TODAY: "TODAY";
            THIS_WEEK: "THIS_WEEK";
            THIS_MONTH: "THIS_MONTH";
            LAST_30_DAYS: "LAST_30_DAYS";
            LAST_90_DAYS: "LAST_90_DAYS";
            THIS_YEAR: "THIS_YEAR";
        }>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        leaveType: z.ZodOptional<z.ZodString>;
        expenseType: z.ZodOptional<z.ZodString>;
        assetCategory: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodOptional<z.ZodString>;
        taskPriority: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    columns: z.ZodOptional<z.ZodArray<z.ZodString>>;
    groupBy: z.ZodOptional<z.ZodArray<z.ZodString>>;
    aggregations: z.ZodOptional<z.ZodRecord<z.ZodString, z.core.SomeType>>;
    visualization: z.ZodOptional<z.ZodEnum<{
        TABLE: "TABLE";
        LINE_CHART: "LINE_CHART";
        BAR_CHART: "BAR_CHART";
        PIE_CHART: "PIE_CHART";
        HEATMAP: "HEATMAP";
    }>>;
    saveAsTemplate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    templateName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GenerateReportDto = z.infer<typeof GenerateReportDtoSchema>;
export type ReportFilter = z.infer<typeof ReportFilterSchema>;
export declare const ListReportsQuerySchema: z.ZodObject<{
    module: z.ZodOptional<z.ZodEnum<{
        ATTENDANCE: "ATTENDANCE";
        PAYROLL: "PAYROLL";
        EMPLOYEES: "EMPLOYEES";
        DEPARTMENTS: "DEPARTMENTS";
        LEAVES: "LEAVES";
        TASKS: "TASKS";
        ASSETS: "ASSETS";
        EXPENSES: "EXPENSES";
        DOCUMENTS: "DOCUMENTS";
        TIMESHEETS: "TIMESHEETS";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;
export declare const ReportTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    module: z.ZodString;
    reportType: z.ZodString;
    defaultFilters: z.ZodOptional<z.ZodObject<{
        dateRange: z.ZodOptional<z.ZodEnum<{
            CUSTOM: "CUSTOM";
            TODAY: "TODAY";
            THIS_WEEK: "THIS_WEEK";
            THIS_MONTH: "THIS_MONTH";
            LAST_30_DAYS: "LAST_30_DAYS";
            LAST_90_DAYS: "LAST_90_DAYS";
            THIS_YEAR: "THIS_YEAR";
        }>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        leaveType: z.ZodOptional<z.ZodString>;
        expenseType: z.ZodOptional<z.ZodString>;
        assetCategory: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodOptional<z.ZodString>;
        taskPriority: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    defaultColumns: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultGroupBy: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultVisualization: z.ZodOptional<z.ZodEnum<{
        TABLE: "TABLE";
        LINE_CHART: "LINE_CHART";
        BAR_CHART: "BAR_CHART";
        PIE_CHART: "PIE_CHART";
        HEATMAP: "HEATMAP";
    }>>;
    createdBy: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    isSystem: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
export declare const ReportDataSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    metadata: z.ZodObject<{
        totalRows: z.ZodNumber;
        generatedAt: z.ZodString;
        filters: z.ZodOptional<z.ZodObject<{
            dateRange: z.ZodOptional<z.ZodEnum<{
                CUSTOM: "CUSTOM";
                TODAY: "TODAY";
                THIS_WEEK: "THIS_WEEK";
                THIS_MONTH: "THIS_MONTH";
                LAST_30_DAYS: "LAST_30_DAYS";
                LAST_90_DAYS: "LAST_90_DAYS";
                THIS_YEAR: "THIS_YEAR";
            }>>;
            startDate: z.ZodOptional<z.ZodString>;
            endDate: z.ZodOptional<z.ZodString>;
            departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            status: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            leaveType: z.ZodOptional<z.ZodString>;
            expenseType: z.ZodOptional<z.ZodString>;
            assetCategory: z.ZodOptional<z.ZodString>;
            taskStatus: z.ZodOptional<z.ZodString>;
            taskPriority: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        columns: z.ZodOptional<z.ZodArray<z.ZodString>>;
        aggregations: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ReportData = z.infer<typeof ReportDataSchema>;
export declare const ReportAuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    reportId: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    module: z.ZodString;
    reportType: z.ZodString;
    generatedBy: z.ZodString;
    generatedByUser: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>>;
    filters: z.ZodOptional<z.ZodObject<{
        dateRange: z.ZodOptional<z.ZodEnum<{
            CUSTOM: "CUSTOM";
            TODAY: "TODAY";
            THIS_WEEK: "THIS_WEEK";
            THIS_MONTH: "THIS_MONTH";
            LAST_30_DAYS: "LAST_30_DAYS";
            LAST_90_DAYS: "LAST_90_DAYS";
            THIS_YEAR: "THIS_YEAR";
        }>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        employeeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        roleIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        leaveType: z.ZodOptional<z.ZodString>;
        expenseType: z.ZodOptional<z.ZodString>;
        assetCategory: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodOptional<z.ZodString>;
        taskPriority: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    exportFormat: z.ZodOptional<z.ZodString>;
    generatedAt: z.ZodString;
}, z.core.$strip>;
export type ReportAuditLog = z.infer<typeof ReportAuditLogSchema>;
export declare const ListAuditLogsQuerySchema: z.ZodObject<{
    module: z.ZodOptional<z.ZodEnum<{
        ATTENDANCE: "ATTENDANCE";
        PAYROLL: "PAYROLL";
        EMPLOYEES: "EMPLOYEES";
        DEPARTMENTS: "DEPARTMENTS";
        LEAVES: "LEAVES";
        TASKS: "TASKS";
        ASSETS: "ASSETS";
        EXPENSES: "EXPENSES";
        DOCUMENTS: "DOCUMENTS";
        TIMESHEETS: "TIMESHEETS";
    }>>;
    generatedBy: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;
export declare const DashboardWidgetSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        TABLE: "TABLE";
        KPI: "KPI";
        CHART: "CHART";
    }>;
    title: z.ZodString;
    module: z.ZodString;
    config: z.ZodRecord<z.ZodAny, z.core.SomeType>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;
export declare const SaveDashboardConfigDtoSchema: z.ZodObject<{
    widgets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            TABLE: "TABLE";
            KPI: "KPI";
            CHART: "CHART";
        }>;
        title: z.ZodString;
        module: z.ZodString;
        config: z.ZodRecord<z.ZodAny, z.core.SomeType>;
        position: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SaveDashboardConfigDto = z.infer<typeof SaveDashboardConfigDtoSchema>;
//# sourceMappingURL=report.dto.d.ts.map