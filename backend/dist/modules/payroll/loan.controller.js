import { PrismaClient, Prisma } from "@prisma/client";
import { CreateLoanDto, UpdateLoanDto, ApproveLoanDto, AddLoanRepaymentDto, ListLoanQuery, } from "./loan.dto.js";
const prisma = new PrismaClient();
export async function createLoan(req, res) {
    try {
        const dto = CreateLoanDto.parse(req.body);
        const userId = req.user?.id;
        // Calculate total amount with interest
        const interestAmount = dto.loanAmount * (dto.interestRate / 100);
        const totalAmount = dto.loanAmount + interestAmount;
        // Calculate end date if not provided (estimate based on monthly payment)
        let endDate = null;
        if (!dto.endDate) {
            const monthsToPay = Math.ceil(totalAmount / dto.monthlyPayment);
            const start = new Date(dto.startDate);
            endDate = new Date(start);
            endDate.setMonth(endDate.getMonth() + monthsToPay);
        }
        else {
            endDate = new Date(dto.endDate);
        }
        const loan = await prisma.loan.create({
            data: {
                employeeId: dto.employeeId,
                loanAmount: new Prisma.Decimal(dto.loanAmount),
                interestRate: new Prisma.Decimal(dto.interestRate),
                totalAmount: new Prisma.Decimal(totalAmount),
                remainingAmount: new Prisma.Decimal(totalAmount),
                monthlyPayment: new Prisma.Decimal(dto.monthlyPayment),
                startDate: new Date(dto.startDate),
                endDate,
                status: "ACTIVE",
                description: dto.description,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return res.status(201).json(loan);
    }
    catch (error) {
        console.error("Create loan error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to create loan" });
    }
}
export async function listLoans(req, res) {
    try {
        const query = ListLoanQuery.parse(req.query);
        const currentUserEmployeeId = req.user?.employeeId;
        const userRoles = req.user?.roles || [];
        const where = {};
        // If not admin/HR, only show own loans
        if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
            if (currentUserEmployeeId) {
                where.employeeId = currentUserEmployeeId;
            }
            else {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        else if (query.employeeId) {
            where.employeeId = query.employeeId;
        }
        if (query.status) {
            where.status = query.status;
        }
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            prisma.loan.findMany({
                where,
                skip,
                take: query.pageSize,
                include: {
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    repaymentHistory: {
                        orderBy: { paymentDate: "desc" },
                        take: 5, // Latest 5 repayments
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.loan.count({ where }),
        ]);
        return res.status(200).json({
            items,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        });
    }
    catch (error) {
        console.error("List loans error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to list loans" });
    }
}
export async function getLoan(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = req.user?.employeeId;
        const userRoles = req.user?.roles || [];
        const loan = await prisma.loan.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                repaymentHistory: {
                    orderBy: { paymentDate: "desc" },
                    include: {
                        loan: {
                            select: {
                                id: true,
                                loanAmount: true,
                            },
                        },
                    },
                },
            },
        });
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        // Check access
        if (!userRoles.includes("ADMIN") && !userRoles.includes("HR")) {
            if (loan.employeeId !== currentUserEmployeeId) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        return res.status(200).json(loan);
    }
    catch (error) {
        console.error("Get loan error:", error);
        return res.status(500).json({ message: "Failed to get loan" });
    }
}
export async function updateLoan(req, res) {
    try {
        const { id } = req.params;
        const dto = UpdateLoanDto.parse(req.body);
        const existing = await prisma.loan.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ message: "Loan not found" });
        }
        const updateData = {};
        if (dto.interestRate !== undefined)
            updateData.interestRate = new Prisma.Decimal(dto.interestRate);
        if (dto.monthlyPayment !== undefined)
            updateData.monthlyPayment = new Prisma.Decimal(dto.monthlyPayment);
        if (dto.status)
            updateData.status = dto.status;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        // If status is COMPLETED and remaining amount is 0, mark as completed
        if (dto.status === "COMPLETED" || (dto.status === undefined && parseFloat(existing.remainingAmount.toString()) <= 0)) {
            updateData.status = "COMPLETED";
        }
        const loan = await prisma.loan.update({
            where: { id },
            data: updateData,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return res.status(200).json(loan);
    }
    catch (error) {
        console.error("Update loan error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to update loan" });
    }
}
export async function approveLoan(req, res) {
    try {
        const { id } = req.params;
        const dto = ApproveLoanDto.parse(req.body);
        const loan = await prisma.loan.update({
            where: { id },
            data: {
                approvedBy: dto.approvedBy,
                approvedAt: new Date(),
                status: "ACTIVE",
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return res.status(200).json(loan);
    }
    catch (error) {
        console.error("Approve loan error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to approve loan" });
    }
}
export async function addLoanRepayment(req, res) {
    try {
        const { id } = req.params;
        const dto = AddLoanRepaymentDto.parse(req.body);
        const loan = await prisma.loan.findUnique({
            where: { id },
        });
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        if (loan.status !== "ACTIVE") {
            return res.status(400).json({ message: "Can only add repayment to active loans" });
        }
        const repaymentAmount = dto.amount;
        const currentRemaining = parseFloat(loan.remainingAmount.toString());
        if (repaymentAmount > currentRemaining) {
            return res.status(400).json({
                message: `Repayment amount (${repaymentAmount}) exceeds remaining amount (${currentRemaining})`,
            });
        }
        // Create repayment record and update loan in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create repayment
            const repayment = await tx.loanRepayment.create({
                data: {
                    loanId: id,
                    payrollRunId: dto.payrollRunId,
                    amount: new Prisma.Decimal(repaymentAmount),
                    paymentDate: new Date(dto.paymentDate),
                    notes: dto.notes,
                },
            });
            // Update loan remaining amount
            const newRemaining = currentRemaining - repaymentAmount;
            const updatedLoan = await tx.loan.update({
                where: { id },
                data: {
                    remainingAmount: new Prisma.Decimal(newRemaining),
                    status: newRemaining <= 0 ? "COMPLETED" : "ACTIVE",
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            return { repayment, loan: updatedLoan };
        });
        return res.status(201).json(result);
    }
    catch (error) {
        console.error("Add loan repayment error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to add loan repayment" });
    }
}
export async function deleteLoan(req, res) {
    try {
        const { id } = req.params;
        const existing = await prisma.loan.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ message: "Loan not found" });
        }
        if (existing.status === "ACTIVE" && parseFloat(existing.remainingAmount.toString()) > 0) {
            return res.status(400).json({ message: "Cannot delete active loan with remaining balance" });
        }
        await prisma.loan.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete loan error:", error);
        return res.status(500).json({ message: "Failed to delete loan" });
    }
}
//# sourceMappingURL=loan.controller.js.map