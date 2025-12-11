import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Run annual salary increment job
 * This should be scheduled to run annually (e.g., every January 1st)
 */
export async function runAnnualIncrementJob(config) {
    const results = {
        successful: 0,
        failed: 0,
        errors: [],
    };
    try {
        // Calculate cutoff date (12 months ago)
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        // Build employee query
        const whereClause = {
            status: "ACTIVE",
            OR: [
                { lastIncrementDate: null }, // Never had an increment
                { lastIncrementDate: { lt: cutoffDate } }, // Last increment was more than 12 months ago
            ],
        };
        if (config.employeeIds && config.employeeIds.length > 0) {
            whereClause.id = { in: config.employeeIds };
        }
        if (config.departmentId) {
            whereClause.departmentId = config.departmentId;
        }
        // Get eligible employees
        const employees = await prisma.employee.findMany({
            where: whereClause,
            include: {
                salaryGrade: true,
                salaryStep: true,
            },
        });
        const incrementDate = new Date();
        // Process increments in a transaction
        await prisma.$transaction(async (tx) => {
            for (const employee of employees) {
                try {
                    const currentSalary = employee.salary
                        ? parseFloat(employee.salary.toString())
                        : employee.salaryStep
                            ? parseFloat(employee.salaryStep.salary.toString())
                            : 0;
                    if (currentSalary === 0) {
                        results.failed++;
                        results.errors.push({
                            employeeId: employee.id,
                            error: "Employee has no salary set",
                        });
                        continue;
                    }
                    const incrementAmount = (currentSalary * config.incrementPercentage) / 100;
                    const newSalary = currentSalary + incrementAmount;
                    // Create increment history
                    await tx.salaryIncrement.create({
                        data: {
                            employeeId: employee.id,
                            previousSalary: new Prisma.Decimal(currentSalary),
                            newSalary: new Prisma.Decimal(newSalary),
                            incrementAmount: new Prisma.Decimal(incrementAmount),
                            incrementPercentage: new Prisma.Decimal(config.incrementPercentage),
                            effectiveDate: incrementDate,
                            reason: config.reason || "Annual salary increment",
                            approvedBy: "SYSTEM", // System-generated
                            notes: config.notes || "Automatic annual increment",
                        },
                    });
                    // Update employee salary
                    await tx.employee.update({
                        where: { id: employee.id },
                        data: {
                            salary: new Prisma.Decimal(newSalary),
                            lastIncrementDate: incrementDate,
                        },
                    });
                    results.successful++;
                }
                catch (error) {
                    results.failed++;
                    results.errors.push({
                        employeeId: employee.id,
                        error: error.message || "Failed to process increment",
                    });
                }
            }
        });
        return results;
    }
    catch (error) {
        console.error("Annual increment job error:", error);
        throw error;
    }
}
/**
 * Schedule annual increment (to be used with a cron library like node-cron or cron)
 * Example usage:
 *
 * import cron from 'node-cron';
 *
 * // Run on January 1st at midnight every year
 * cron.schedule('0 0 1 1 *', async () => {
 *   await runAnnualIncrementJob({
 *     incrementPercentage: 5, // 5% annual increment
 *     reason: 'Annual salary increment',
 *     notes: 'Automatic annual increment for all eligible employees',
 *   });
 * });
 */
export function scheduleAnnualIncrement(cronExpression, config, cronLib // Accept any cron library (node-cron, cron, etc.)
) {
    if (!cronLib) {
        console.warn("No cron library provided. Please install node-cron or similar and pass it to scheduleAnnualIncrement.");
        return null;
    }
    return cronLib.schedule(cronExpression, async () => {
        console.log("Running annual salary increment job...");
        try {
            const results = await runAnnualIncrementJob(config);
            console.log(`Annual increment completed: ${results.successful} successful, ${results.failed} failed`);
        }
        catch (error) {
            console.error("Annual increment job failed:", error);
        }
    });
}
//# sourceMappingURL=salary-increment-scheduler.js.map