/**
 * Generate PDF payslip for a payroll item
 * Note: This is a placeholder implementation.
 * You'll need to install a PDF library like pdfkit or puppeteer
 * For now, we'll create a structured data object that can be used to generate PDFs
 */
export interface PayslipData {
    employee: {
        id: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        designation?: string;
    };
    payrollRun: {
        id: string;
        periodStart: Date;
        periodEnd: Date;
        periodType: string;
        paymentDate?: Date | null;
    };
    payrollItem: {
        basicSalary: number;
        allowances: number;
        overtime: number;
        bonus: number;
        grossSalary: number;
        incomeTax: number;
        pension: number;
        healthInsurance: number;
        providentFund: number;
        loanDeductions: number;
        advanceDeductions: number;
        absenceDeductions: number;
        otherDeductions: number;
        totalDeductions: number;
        netSalary: number;
        workingDays: number;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
    };
    organization?: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
        logoUrl?: string;
    };
}
/**
 * Generate payslip data structure
 */
export declare function generatePayslipData(payrollItemId: string): Promise<PayslipData>;
/**
 * Generate PDF payslip (placeholder - requires PDF library)
 * To implement: Install pdfkit or puppeteer and implement actual PDF generation
 *
 * Example with pdfkit:
 * ```typescript
 * import PDFDocument from 'pdfkit';
 *
 * export async function generatePayslipPDF(payslipData: PayslipData): Promise<Buffer> {
 *   const doc = new PDFDocument({ margin: 50 });
 *   const buffers: Buffer[] = [];
 *
 *   doc.on('data', buffers.push.bind(buffers));
 *
 *   // Add company logo if available
 *   if (payslipData.organization?.logoUrl) {
 *     // Load and add logo
 *   }
 *
 *   // Add header
 *   doc.fontSize(20).text('PAYSLIP', { align: 'center' });
 *
 *   // Add employee info
 *   doc.fontSize(12).text(`Employee: ${payslipData.employee.firstName} ${payslipData.employee.lastName}`);
 *   // ... add all payslip details
 *
 *   doc.end();
 *
 *   return new Promise((resolve) => {
 *     doc.on('end', () => resolve(Buffer.concat(buffers)));
 *   });
 * }
 * ```
 */
export declare function generatePayslipPDF(payslipData: PayslipData): Promise<Buffer>;
/**
 * Save payslip PDF and update payroll item with URL
 */
export declare function generateAndSavePayslip(payrollItemId: string, outputDir?: string): Promise<string>;
//# sourceMappingURL=payslip-generator.d.ts.map