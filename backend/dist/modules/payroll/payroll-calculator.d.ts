/**
 * Calculate income tax based on Ethiopian PAYE tax brackets
 * Can use dynamic tax rates from database if available
 */
export declare function calculateIncomeTax(grossSalary: number, year?: number): Promise<number>;
/**
 * Calculate pension contribution (employee portion)
 */
export declare function calculatePension(grossSalary: number, year?: number): Promise<number>;
/**
 * Calculate total allowances for an employee for a specific month
 */
export declare function calculateAllowances(employeeId: string, periodStart: Date, periodEnd: Date, basicSalary: number): Promise<number>;
/**
 * Calculate total loan deductions for an employee
 */
export declare function calculateLoanDeductions(employeeId: string, payrollRunId?: string): Promise<number>;
/**
 * Calculate total advance deductions for an employee
 */
export declare function calculateAdvanceDeductions(employeeId: string, payrollRunId?: string): Promise<number>;
/**
 * Calculate absence deductions based on attendance
 */
export declare function calculateAbsenceDeductions(basicSalary: number, workingDays: number, absentDays: number): number;
/**
 * Calculate complete payroll item for an employee
 */
export interface PayrollCalculationResult {
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
}
export declare function calculatePayrollItem(employeeId: string, periodStart: Date, periodEnd: Date, options?: {
    overtime?: number;
    bonus?: number;
    healthInsuranceRate?: number;
    providentFundRate?: number;
    otherDeductions?: number;
}): Promise<PayrollCalculationResult>;
//# sourceMappingURL=payroll-calculator.d.ts.map