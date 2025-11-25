import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Merge field patterns - supports {{field}} and {field}
const MERGE_FIELD_REGEX = /\{\{?([\w.]+)\}?\}/g;
/**
 * Fetch employee data for merge fields
 */
async function getEmployeeData(employeeId) {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            department: true,
            manager: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    if (!employee) {
        return {};
    }
    const formatDate = (date) => {
        if (!date)
            return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
    return {
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        fullName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        email: employee.email || "",
        phone: employee.phone || "",
        employeeCode: employee.employeeCode || "",
        designation: employee.designation || "",
        department: employee.department?.name || "",
        joiningDate: formatDate(employee.joiningDate),
        salary: employee.salary ? employee.salary.toString() : "",
        address: employee.address || "",
        dateOfBirth: formatDate(employee.dateOfBirth),
        gender: employee.gender || "",
        manager: employee.manager
            ? `${employee.manager.firstName} ${employee.manager.lastName}`.trim()
            : "",
    };
}
/**
 * Get department data for merge fields
 */
async function getDepartmentData(departmentId) {
    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            manager: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    if (!department) {
        return {};
    }
    return {
        name: department.name || "",
        manager: department.manager
            ? `${department.manager.firstName} ${department.manager.lastName}`.trim()
            : "",
    };
}
/**
 * Get payroll data for merge fields
 */
async function getPayrollData(employeeId) {
    // Get latest payroll item for employee
    const latestPayroll = await prisma.payrollItem.findFirst({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
        include: {
            payrollRun: true,
        },
    });
    if (!latestPayroll) {
        return {};
    }
    const formatCurrency = (value) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(num))
            return "0.00";
        return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    return {
        basicSalary: formatCurrency(latestPayroll.basicSalary),
        grossSalary: formatCurrency(latestPayroll.grossSalary),
        netSalary: formatCurrency(latestPayroll.netSalary),
        allowances: formatCurrency(latestPayroll.allowances),
        deductions: formatCurrency(latestPayroll.totalDeductions),
        incomeTax: formatCurrency(latestPayroll.incomeTax),
        pension: formatCurrency(latestPayroll.pension),
        period: latestPayroll.payrollRun
            ? `${new Date(latestPayroll.payrollRun.periodStart).toLocaleDateString()} - ${new Date(latestPayroll.payrollRun.periodEnd).toLocaleDateString()}`
            : "",
    };
}
/**
 * Get default company data
 */
function getCompanyData() {
    return {
        name: "Chiro HRMS",
        address: "123 Main Street, Addis Ababa, Ethiopia",
        phone: "+251-11-123-4567",
        email: "info@chiro.gov.et",
    };
}
/**
 * Get current date data
 */
function getDateData() {
    const now = new Date();
    return {
        today: now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        formatted: now.toLocaleDateString("en-US"),
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString(),
        day: now.getDate().toString(),
    };
}
/**
 * Get sample data for preview
 */
function getSampleData() {
    return {
        employee: {
            firstName: "John",
            lastName: "Doe",
            fullName: "John Doe",
            email: "john.doe@example.com",
            phone: "+251-911-234-567",
            employeeCode: "EMP-001234",
            designation: "Senior Developer",
            department: "IT",
            joiningDate: "January 15, 2023",
            salary: "35,000.00",
            address: "Addis Ababa, Ethiopia",
            dateOfBirth: "January 1, 1990",
            gender: "Male",
            manager: "Jane Manager",
            salaryGrade: "Grade 2",
            salaryStep: "30,000.00",
        },
        department: {
            name: "Information Technology",
            manager: "Jane Manager",
        },
        payroll: {
            basicSalary: "30,000.00",
            grossSalary: "35,000.00",
            netSalary: "28,500.00",
            allowances: "5,000.00",
            deductions: "6,500.00",
            incomeTax: "3,500.00",
            pension: "2,100.00",
            period: "January 1, 2024 - January 31, 2024",
        },
        company: getCompanyData(),
        date: getDateData(),
    };
}
/**
 * Resolve merge field value from nested object path
 */
function resolveMergeField(data, fieldPath) {
    const parts = fieldPath.split(".");
    let value = data;
    for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
            value = value[part];
        }
        else {
            return ""; // Field not found
        }
    }
    return value != null ? String(value) : "";
}
/**
 * Replace merge fields in template content
 */
export async function processTemplate(content, employeeId, customMergeData, useSampleData = false) {
    let mergeData;
    if (useSampleData) {
        mergeData = getSampleData();
    }
    else if (employeeId) {
        // Fetch real data
        const [employee, payroll] = await Promise.all([
            getEmployeeData(employeeId),
            getPayrollData(employeeId),
        ]);
        const departmentId = await prisma.employee
            .findUnique({
            where: { id: employeeId },
            select: { departmentId: true },
        })
            .then((emp) => emp?.departmentId);
        const department = departmentId ? await getDepartmentData(departmentId) : {};
        mergeData = {
            employee,
            department,
            payroll,
            company: getCompanyData(),
            date: getDateData(),
            ...customMergeData,
        };
    }
    else {
        // Use custom data or sample
        mergeData = {
            ...getSampleData(),
            ...customMergeData,
        };
    }
    // Replace all merge fields
    const processed = content.replace(MERGE_FIELD_REGEX, (match, fieldPath) => {
        const value = resolveMergeField(mergeData, fieldPath.trim());
        return value || match; // Return original if not found (or empty string)
    });
    return processed;
}
/**
 * Extract all merge fields from template content
 */
export function extractMergeFields(content) {
    const fields = new Set();
    const matches = content.matchAll(MERGE_FIELD_REGEX);
    for (const match of matches) {
        fields.add(match[1].trim());
    }
    return Array.from(fields);
}
/**
 * Validate merge fields in template
 */
export function validateMergeFields(content, availableFields) {
    const usedFields = extractMergeFields(content);
    const missing = usedFields.filter((field) => !availableFields.includes(field));
    return {
        valid: missing.length === 0,
        missing,
    };
}
//# sourceMappingURL=template-engine.js.map