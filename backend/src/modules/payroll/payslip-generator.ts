
import * as fs from "fs";
import prisma from "../../db/client.js";
import * as path from "path";

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
export async function generatePayslipData(payrollItemId: string): Promise<PayslipData> {
  const payrollItem = await prisma.payrollItem.findUnique({
    where: { id: payrollItemId },
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          designation: true,
        },
      },
      payrollRun: {
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          periodType: true,
          paymentDate: true,
        },
      },
    },
  });

  if (!payrollItem) {
    throw new Error("Payroll item not found");
  }

  return {
    employee: {
      id: payrollItem.employee.id,
      employeeCode: payrollItem.employee.employeeCode,
      firstName: payrollItem.employee.firstName,
      lastName: payrollItem.employee.lastName,
      email: payrollItem.employee.email || undefined,
      phone: payrollItem.employee.phone || undefined,
      designation: payrollItem.employee.designation || undefined,
    },
    payrollRun: {
      id: payrollItem.payrollRun.id,
      periodStart: payrollItem.payrollRun.periodStart,
      periodEnd: payrollItem.payrollRun.periodEnd,
      periodType: payrollItem.payrollRun.periodType,
      paymentDate: payrollItem.payrollRun.paymentDate,
    },
    payrollItem: {
      basicSalary: parseFloat(payrollItem.basicSalary.toString()),
      allowances: parseFloat(payrollItem.allowances.toString()),
      overtime: parseFloat(payrollItem.overtime.toString()),
      bonus: parseFloat(payrollItem.bonus.toString()),
      grossSalary: parseFloat(payrollItem.grossSalary.toString()),
      incomeTax: parseFloat(payrollItem.incomeTax.toString()),
      pension: parseFloat(payrollItem.pension.toString()),
      healthInsurance: parseFloat(payrollItem.healthInsurance.toString()),
      providentFund: parseFloat(payrollItem.providentFund.toString()),
      loanDeductions: parseFloat(payrollItem.loanDeductions.toString()),
      advanceDeductions: parseFloat(payrollItem.advanceDeductions.toString()),
      absenceDeductions: parseFloat(payrollItem.absenceDeductions.toString()),
      otherDeductions: parseFloat(payrollItem.otherDeductions.toString()),
      totalDeductions: parseFloat(payrollItem.totalDeductions.toString()),
      netSalary: parseFloat(payrollItem.netSalary.toString()),
      workingDays: payrollItem.workingDays,
      presentDays: payrollItem.presentDays,
      absentDays: payrollItem.absentDays,
      leaveDays: payrollItem.leaveDays,
    },
  };
}

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
export async function generatePayslipPDF(payslipData: PayslipData): Promise<Buffer> {
  // TODO: Implement actual PDF generation using pdfkit, puppeteer, or similar
  // For now, return empty buffer
  // This is a placeholder that should be replaced with actual PDF generation
  
  throw new Error(
    "PDF generation not implemented. Please install pdfkit or puppeteer and implement generatePayslipPDF function."
  );
}

/**
 * Save payslip PDF and update payroll item with URL
 */
export async function generateAndSavePayslip(
  payrollItemId: string,
  outputDir: string = "uploads/payslips"
): Promise<string> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate payslip data
  const payslipData = await generatePayslipData(payrollItemId);

  // Generate PDF (placeholder - needs implementation)
  const pdfBuffer = await generatePayslipPDF(payslipData);

  // Save PDF file
  const filename = `payslip_${payrollItemId}_${Date.now()}.pdf`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, pdfBuffer);

  // Update payroll item with payslip URL
  const url = `/uploads/payslips/${filename}`;
  await prisma.payrollItem.update({
    where: { id: payrollItemId },
    data: {
      payslipGenerated: true,
      payslipUrl: url,
      generatedAt: new Date(),
    },
  });

  return url;
}

