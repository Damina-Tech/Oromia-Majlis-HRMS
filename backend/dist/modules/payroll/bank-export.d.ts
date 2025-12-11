/**
 * Bank export format interface
 */
export interface BankExportRow {
    employeeName: string;
    employeeCode: string;
    accountNumber: string;
    bankName: string;
    netSalary: number;
    currency?: string;
}
/**
 * Generate bank export file (CSV format)
 */
export declare function generateBankExport(payrollRunId: string, format?: "csv" | "txt"): Promise<string>;
/**
 * Get bank export as buffer (for direct download)
 */
export declare function getBankExportBuffer(payrollRunId: string, format?: "csv" | "txt"): Promise<Buffer>;
//# sourceMappingURL=bank-export.d.ts.map