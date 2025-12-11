import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
export async function generateBankExport(
  payrollRunId: string,
  format: "csv" | "txt" = "csv"
): Promise<string> {
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      items: {
        where: {
          netSalary: {
            gt: 0,
          },
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
        orderBy: [
          { employee: { lastName: "asc" } },
          { employee: { firstName: "asc" } },
        ],
      },
    },
  });

  if (!payrollRun) {
    throw new Error("Payroll run not found");
  }

  if (payrollRun.status !== "PROCESSED") {
    throw new Error("Payroll run must be processed or approved before exporting");
  }

  const rows: BankExportRow[] = payrollRun.items.map((item) => ({
    employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
    employeeCode: item.employee.employeeCode,
    accountNumber: item.bankAccountNumber || "N/A",
    bankName: item.bankName || "N/A",
    netSalary: parseFloat(item.netSalary.toString()),
    currency: "ETB",
  }));

  if (format === "csv") {
    return generateCSVExport(rows);
  } else {
    return generateTextExport(rows);
  }
}

/**
 * Generate CSV format export
 */
function generateCSVExport(rows: BankExportRow[]): string {
  const headers = [
    "Employee Name",
    "Employee Code",
    "Account Number",
    "Bank Name",
    "Net Salary",
    "Currency",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      [
        `"${row.employeeName}"`,
        `"${row.employeeCode}"`,
        `"${row.accountNumber}"`,
        `"${row.bankName}"`,
        row.netSalary.toFixed(2),
        row.currency || "ETB",
      ].join(",")
    ),
  ];

  return csvRows.join("\n");
}

/**
 * Generate text format export (fixed-width or delimited)
 */
function generateTextExport(rows: BankExportRow[]): string {
  // Fixed-width format for bank compatibility
  const lines: string[] = [];

  // Header
  lines.push("=".repeat(100));
  lines.push("BANK PAYROLL EXPORT FILE");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Employees: ${rows.length}`);
  lines.push("=".repeat(100));
  lines.push("");

  // Column headers
  lines.push(
    "Employee Name".padEnd(30) +
      "Employee Code".padEnd(15) +
      "Account Number".padEnd(20) +
      "Bank Name".padEnd(20) +
      "Net Salary".padStart(15)
  );
  lines.push("-".repeat(100));

  // Data rows
  rows.forEach((row) => {
    lines.push(
      row.employeeName.padEnd(30) +
        row.employeeCode.padEnd(15) +
        (row.accountNumber || "N/A").padEnd(20) +
        (row.bankName || "N/A").padEnd(20) +
        row.netSalary.toFixed(2).padStart(15)
    );
  });

  lines.push("-".repeat(100));

  // Footer
  const total = rows.reduce((sum, row) => sum + row.netSalary, 0);
  lines.push(`Total Amount: ${total.toFixed(2)} ${rows[0]?.currency || "ETB"}`);

  return lines.join("\n");
}

/**
 * Get bank export as buffer (for direct download)
 */
export async function getBankExportBuffer(
  payrollRunId: string,
  format: "csv" | "txt" = "csv"
): Promise<Buffer> {
  const content = await generateBankExport(payrollRunId, format);
  return Buffer.from(content, "utf-8");
}

