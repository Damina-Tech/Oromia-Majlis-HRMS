export interface MergeFieldData {
    employee?: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
        phone?: string;
        employeeCode?: string;
        designation?: string;
        department?: string;
        joiningDate?: string;
        salary?: string;
        address?: string;
        dateOfBirth?: string;
        gender?: string;
        [key: string]: any;
    };
    department?: {
        name?: string;
        manager?: string;
        [key: string]: any;
    };
    payroll?: {
        basicSalary?: string;
        grossSalary?: string;
        netSalary?: string;
        allowances?: string;
        deductions?: string;
        [key: string]: any;
    };
    company?: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
        [key: string]: any;
    };
    date?: {
        today?: string;
        formatted?: string;
        year?: string;
        month?: string;
        day?: string;
        [key: string]: any;
    };
    [key: string]: any;
}
/**
 * Replace merge fields in template content
 */
export declare function processTemplate(content: string, employeeId?: string, customMergeData?: Record<string, any>, useSampleData?: boolean): Promise<string>;
/**
 * Extract all merge fields from template content
 */
export declare function extractMergeFields(content: string): string[];
/**
 * Validate merge fields in template
 */
export declare function validateMergeFields(content: string, availableFields: string[]): {
    valid: boolean;
    missing: string[];
};
//# sourceMappingURL=template-engine.d.ts.map