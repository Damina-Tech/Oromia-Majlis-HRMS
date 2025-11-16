import { PrismaClient, NotificationModule, NotificationType } from "@prisma/client";
import { CreateExpenseDto, UpdateExpenseDto, ListExpensesQuery, SubmitExpenseDto, ApproveExpenseDto, RejectExpenseDto, PayExpenseDto, } from "./expense.dto.js";
import { paginate } from "../../utils/pagination.js";
import { NotificationService } from "../notifications/notification.service.js";
const prisma = new PrismaClient();
// Helper functions
function getCurrentUserId(req) {
    return req.user?.id;
}
function getCurrentUserEmployeeId(req) {
    return req.user?.employeeId || null;
}
function getCurrentUserRoles(req) {
    return req.user?.roles || [];
}
// Generate reference number: EXP-YYYY-0001
async function generateReferenceNo() {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}-`;
    const lastExpense = await prisma.expense.findFirst({
        where: {
            referenceNo: {
                startsWith: prefix,
            },
        },
        orderBy: {
            referenceNo: "desc",
        },
    });
    let sequence = 1;
    if (lastExpense) {
        const lastSeq = parseInt(lastExpense.referenceNo.split("-")[2] || "0");
        sequence = lastSeq + 1;
    }
    return `${prefix}${sequence.toString().padStart(4, "0")}`;
}
/**
 * Create expense
 */
export async function createExpense(req, res) {
    try {
        const currentUserId = getCurrentUserId(req);
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        if (!currentUserEmployeeId) {
            return res.status(400).json({ message: "Employee ID not found. Please link your account to an employee." });
        }
        const data = CreateExpenseDto.parse(req.body);
        const referenceNo = await generateReferenceNo();
        const expense = await prisma.expense.create({
            data: {
                referenceNo,
                title: data.title,
                description: data.description,
                amount: data.amount,
                currency: data.currency || "ETB",
                expenseType: data.expenseType,
                status: data.submit ? "SUBMITTED" : "DRAFT",
                incurredDate: new Date(data.incurredDate),
                submittedBy: currentUserEmployeeId,
                departmentId: data.departmentId,
                assetId: data.assetId || null,
                vendorId: data.vendorId || null,
                paymentMethod: data.paymentMethod || null,
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        userId: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                asset: {
                    select: {
                        id: true,
                        name: true,
                        assetCode: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        // If submitted, create approval record
        if (data.submit) {
            await prisma.expenseApproval.create({
                data: {
                    expenseId: expense.id,
                    approverId: currentUserEmployeeId,
                    action: "SUBMITTED",
                    comment: "Expense submitted for approval",
                },
            });
        }
        try {
            if (data.submit) {
                await NotificationService.sendNotification({
                    module: NotificationModule.EXPENSE,
                    type: NotificationType.INFO,
                    title: `Expense submitted: ${expense.title}`,
                    message: `${expense.submittedByEmployee.firstName} ${expense.submittedByEmployee.lastName} submitted an expense for ${Number(expense.amount).toLocaleString()} ${expense.currency}.`,
                    resourceType: "EXPENSE",
                    resourceId: expense.id,
                    dedupKey: `expense-submitted-${expense.id}`,
                    targets: {
                        roleNames: ["FINANCE", "HR", "MANAGER"],
                        departmentIds: expense.departmentId ? [expense.departmentId] : undefined,
                        excludeUserIds: [currentUserId],
                    },
                });
            }
            else if (expense.submittedByEmployee.userId) {
                await NotificationService.sendNotification({
                    module: NotificationModule.EXPENSE,
                    type: NotificationType.INFO,
                    title: `Expense saved as draft`,
                    message: `${expense.title} has been saved as draft.`,
                    resourceType: "EXPENSE",
                    resourceId: expense.id,
                    targets: {
                        userIds: [expense.submittedByEmployee.userId],
                    },
                });
            }
        }
        catch (notifyError) {
            console.warn("Failed to send expense notification:", notifyError);
        }
        return res.status(201).json(expense);
    }
    catch (error) {
        console.error("Create expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to create expense" });
    }
}
/**
 * List expenses
 */
export async function listExpenses(req, res) {
    try {
        const query = ListExpensesQuery.parse(req.query);
        const currentUserId = getCurrentUserId(req);
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const isFinance = currentUserRoles.some((r) => r.toUpperCase() === "FINANCE");
        const hasViewAll = req.user?.permissions?.includes("expense.view_all") || false;
        const where = {};
        // Filters
        if (query.status) {
            where.status = query.status;
        }
        if (query.expenseType) {
            where.expenseType = query.expenseType;
        }
        if (query.departmentId) {
            where.departmentId = query.departmentId;
        }
        if (query.submittedBy) {
            where.submittedBy = query.submittedBy;
        }
        if (query.dateFrom || query.dateTo) {
            where.incurredDate = {};
            if (query.dateFrom) {
                where.incurredDate.gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                where.incurredDate.lte = new Date(query.dateTo);
            }
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
                { referenceNo: { contains: query.search, mode: "insensitive" } },
            ];
        }
        // Access control: Non-admin users only see their own expenses unless they have view_all permission
        // But if submittedBy is explicitly provided in query, respect it (for "My Expenses" page)
        if (!query.submittedBy) {
            if (!isAdmin && !isHR && !isFinance && !hasViewAll) {
                if (currentUserEmployeeId) {
                    where.submittedBy = currentUserEmployeeId;
                }
                else {
                    // User without employeeId can't see any expenses
                    where.id = "impossible-id";
                }
            }
        }
        else {
            // If submittedBy is provided, ensure user can only see their own expenses unless they have view_all
            if (!isAdmin && !isHR && !isFinance && !hasViewAll) {
                if (query.submittedBy !== currentUserEmployeeId) {
                    // User trying to view other user's expenses without permission
                    where.id = "impossible-id";
                }
            }
        }
        const { skip, take } = paginate(query.page, query.pageSize);
        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                include: {
                    submittedByEmployee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            employeeCode: true,
                        },
                    },
                    department: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            assetCode: true,
                        },
                    },
                    vendor: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    approvedByEmployee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    paidByEmployee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: {
                            approvals: true,
                            payments: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take,
            }),
            prisma.expense.count({ where }),
        ]);
        return res.json({
            items: expenses,
            total,
            page: query.page || 1,
            pageSize: query.pageSize || 20,
            totalPages: Math.ceil(total / (query.pageSize || 20)),
        });
    }
    catch (error) {
        console.error("List expenses error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to list expenses" });
    }
}
/**
 * Get expense detail
 */
export async function getExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const isFinance = currentUserRoles.some((r) => r.toUpperCase() === "FINANCE");
        const hasViewAll = req.user?.permissions?.includes("expense.view_all") || false;
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        email: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        managerId: true,
                    },
                },
                asset: {
                    select: {
                        id: true,
                        name: true,
                        assetCode: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        name: true,
                        contact: true,
                        phone: true,
                        email: true,
                    },
                },
                approvedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                paidByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                approvals: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeCode: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                payments: {
                    include: {
                        paidByEmployee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: {
                        paidAt: "desc",
                    },
                },
            },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        // Access control
        if (!isAdmin && !isHR && !isFinance && !hasViewAll) {
            if (currentUserEmployeeId && expense.submittedBy !== currentUserEmployeeId) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        return res.json(expense);
    }
    catch (error) {
        console.error("Get expense error:", error);
        return res.status(500).json({ message: "Failed to get expense" });
    }
}
/**
 * Update expense (only allowed in DRAFT status or by admin/HR)
 */
export async function updateExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = getCurrentUserId(req);
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const data = UpdateExpenseDto.parse(req.body);
        const expense = await prisma.expense.findUnique({
            where: { id },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        // Only allow editing if DRAFT or user is admin/HR
        if (expense.status !== "DRAFT" && !isAdmin && !isHR) {
            return res.status(403).json({ message: "Only draft expenses can be edited" });
        }
        // Only submitter or admin/HR can edit
        if (expense.submittedBy !== currentUserEmployeeId && !isAdmin && !isHR) {
            return res.status(403).json({ message: "Access denied" });
        }
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                amount: data.amount,
                currency: data.currency,
                expenseType: data.expenseType,
                incurredDate: data.incurredDate ? new Date(data.incurredDate) : undefined,
                departmentId: data.departmentId,
                assetId: data.assetId,
                vendorId: data.vendorId,
                paymentMethod: data.paymentMethod,
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                asset: {
                    select: {
                        id: true,
                        name: true,
                        assetCode: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        console.error("Update expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to update expense" });
    }
}
/**
 * Submit expense for approval
 */
export async function submitExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserId = getCurrentUserId(req);
        const data = SubmitExpenseDto.parse(req.body);
        if (!currentUserEmployeeId) {
            return res.status(400).json({ message: "Employee ID not found" });
        }
        const expense = await prisma.expense.findUnique({
            where: { id },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (expense.status !== "DRAFT") {
            return res.status(400).json({ message: "Only draft expenses can be submitted" });
        }
        if (expense.submittedBy !== currentUserEmployeeId) {
            return res.status(403).json({ message: "Only the submitter can submit the expense" });
        }
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                status: "SUBMITTED",
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        userId: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        // Create approval record
        await prisma.expenseApproval.create({
            data: {
                expenseId: expense.id,
                approverId: currentUserEmployeeId,
                action: "SUBMITTED",
                comment: data.comment || "Expense submitted for approval",
            },
        });
        try {
            await NotificationService.sendNotification({
                module: NotificationModule.EXPENSE,
                type: NotificationType.INFO,
                title: `Expense submitted: ${updated.title}`,
                message: `Expense ${updated.referenceNo} submitted for approval.`,
                resourceType: "EXPENSE",
                resourceId: updated.id,
                targets: {
                    roleNames: ["FINANCE", "HR", "MANAGER"],
                    departmentIds: updated.departmentId ? [updated.departmentId] : undefined,
                    excludeUserIds: currentUserId ? [currentUserId] : undefined,
                },
            });
        }
        catch (notifyError) {
            console.warn("Failed to send expense submit notification:", notifyError);
        }
        return res.json(updated);
    }
    catch (error) {
        console.error("Submit expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to submit expense" });
    }
}
/**
 * Approve expense
 */
export async function approveExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserId = getCurrentUserId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const isFinance = currentUserRoles.some((r) => r.toUpperCase() === "FINANCE");
        const hasApprovePermission = req.user?.permissions?.includes("expense.approve") || false;
        const data = ApproveExpenseDto.parse(req.body);
        if (!currentUserEmployeeId) {
            return res.status(400).json({ message: "Employee ID not found" });
        }
        if (!isAdmin && !isHR && !isFinance && !hasApprovePermission) {
            return res.status(403).json({ message: "You don't have permission to approve expenses" });
        }
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                department: true,
            },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (expense.status !== "SUBMITTED") {
            return res.status(400).json({ message: "Only submitted expenses can be approved" });
        }
        // Check if user is department manager for departmental expenses
        if (expense.department?.managerId) {
            const manager = await prisma.user.findUnique({
                where: { id: expense.department.managerId },
                include: {
                    employee: true,
                },
            });
            // If expense is for a specific department and user is not admin/HR/finance, check if they're the department manager
            if (!isAdmin && !isHR && !isFinance && manager?.employee?.id !== currentUserEmployeeId) {
                return res.status(403).json({ message: "Only department manager can approve this expense" });
            }
        }
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedBy: currentUserEmployeeId,
                approvedAt: new Date(),
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        userId: true,
                    },
                },
                approvedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        // Create approval record
        await prisma.expenseApproval.create({
            data: {
                expenseId: expense.id,
                approverId: currentUserEmployeeId,
                action: "APPROVED",
                comment: data.comment || "Expense approved",
            },
        });
        try {
            if (updated.submittedByEmployee?.userId) {
                await NotificationService.sendNotification({
                    module: NotificationModule.EXPENSE,
                    type: NotificationType.SUCCESS,
                    title: `Expense approved: ${updated.title}`,
                    message: `Expense ${updated.referenceNo} was approved.`,
                    resourceType: "EXPENSE",
                    resourceId: updated.id,
                    targets: {
                        userIds: [updated.submittedByEmployee.userId],
                    },
                });
            }
            await NotificationService.sendNotification({
                module: NotificationModule.EXPENSE,
                type: NotificationType.INFO,
                title: `Expense ${updated.referenceNo} approved`,
                message: `${updated.title} approved by ${updated.approvedByEmployee?.firstName ?? "Finance"}.`,
                resourceType: "EXPENSE",
                resourceId: updated.id,
                targets: {
                    roleNames: ["FINANCE"],
                    excludeUserIds: currentUserId ? [currentUserId] : undefined,
                },
            });
        }
        catch (notifyError) {
            console.warn("Failed to send expense approval notification:", notifyError);
        }
        return res.json(updated);
    }
    catch (error) {
        console.error("Approve expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to approve expense" });
    }
}
/**
 * Reject expense
 */
export async function rejectExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserId = getCurrentUserId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const isFinance = currentUserRoles.some((r) => r.toUpperCase() === "FINANCE");
        const hasApprovePermission = req.user?.permissions?.includes("expense.approve") || false;
        const data = RejectExpenseDto.parse(req.body);
        if (!currentUserEmployeeId) {
            return res.status(400).json({ message: "Employee ID not found" });
        }
        if (!isAdmin && !isHR && !isFinance && !hasApprovePermission) {
            return res.status(403).json({ message: "You don't have permission to reject expenses" });
        }
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                department: true,
            },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (expense.status !== "SUBMITTED") {
            return res.status(400).json({ message: "Only submitted expenses can be rejected" });
        }
        // Check if user is department manager for departmental expenses
        if (expense.department?.managerId) {
            const manager = await prisma.user.findUnique({
                where: { id: expense.department.managerId },
                include: {
                    employee: true,
                },
            });
            if (!isAdmin && !isHR && !isFinance && manager?.employee?.id !== currentUserEmployeeId) {
                return res.status(403).json({ message: "Only department manager can reject this expense" });
            }
        }
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                status: "REJECTED",
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        userId: true,
                    },
                },
            },
        });
        // Create approval record
        await prisma.expenseApproval.create({
            data: {
                expenseId: expense.id,
                approverId: currentUserEmployeeId,
                action: "REJECTED",
                comment: data.comment,
            },
        });
        try {
            if (updated.submittedByEmployee?.userId) {
                await NotificationService.sendNotification({
                    module: NotificationModule.EXPENSE,
                    type: NotificationType.WARNING,
                    title: `Expense rejected: ${updated.title}`,
                    message: data.comment
                        ? `Expense ${updated.referenceNo} was rejected: ${data.comment}`
                        : `Expense ${updated.referenceNo} was rejected.`,
                    resourceType: "EXPENSE",
                    resourceId: updated.id,
                    targets: {
                        userIds: [updated.submittedByEmployee.userId],
                    },
                });
            }
            await NotificationService.sendNotification({
                module: NotificationModule.EXPENSE,
                type: NotificationType.INFO,
                title: `Expense ${updated.referenceNo} rejected`,
                message: `${updated.title} rejected by finance.`,
                resourceType: "EXPENSE",
                resourceId: updated.id,
                targets: {
                    roleNames: ["FINANCE"],
                    excludeUserIds: currentUserId ? [currentUserId] : undefined,
                },
            });
        }
        catch (notifyError) {
            console.warn("Failed to send expense rejection notification:", notifyError);
        }
        return res.json(updated);
    }
    catch (error) {
        console.error("Reject expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to reject expense" });
    }
}
/**
 * Mark expense as paid
 */
export async function payExpense(req, res) {
    try {
        const { id } = req.params;
        const currentUserEmployeeId = getCurrentUserEmployeeId(req);
        const currentUserId = getCurrentUserId(req);
        const currentUserRoles = getCurrentUserRoles(req);
        const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
        const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
        const isFinance = currentUserRoles.some((r) => r.toUpperCase() === "FINANCE");
        const hasPayPermission = req.user?.permissions?.includes("expense.pay") || false;
        const data = PayExpenseDto.parse(req.body);
        if (!currentUserEmployeeId) {
            return res.status(400).json({ message: "Employee ID not found" });
        }
        if (!isAdmin && !isHR && !isFinance && !hasPayPermission) {
            return res.status(403).json({ message: "You don't have permission to mark expenses as paid" });
        }
        const expense = await prisma.expense.findUnique({
            where: { id },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (expense.status !== "APPROVED") {
            return res.status(400).json({ message: "Only approved expenses can be marked as paid" });
        }
        // Create payment record
        const payment = await prisma.expensePayment.create({
            data: {
                expenseId: expense.id,
                paidAmount: expense.amount,
                paymentMethod: data.paymentMethod,
                paymentReference: data.paymentReference || null,
                paidBy: currentUserEmployeeId,
                notes: data.notes || null,
            },
        });
        // Update expense status
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                status: "PAID",
                paidBy: currentUserEmployeeId,
                paidAt: new Date(),
                paymentMethod: data.paymentMethod,
            },
            include: {
                submittedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        userId: true,
                    },
                },
                paidByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                payments: {
                    include: {
                        paidByEmployee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: {
                        paidAt: "desc",
                    },
                },
            },
        });
        try {
            if (updated.submittedByEmployee?.userId) {
                await NotificationService.sendNotification({
                    module: NotificationModule.EXPENSE,
                    type: NotificationType.SUCCESS,
                    title: `Expense paid: ${updated.title}`,
                    message: `Expense ${updated.referenceNo} has been marked as paid.`,
                    resourceType: "EXPENSE",
                    resourceId: updated.id,
                    targets: {
                        userIds: [updated.submittedByEmployee.userId],
                    },
                });
            }
            await NotificationService.sendNotification({
                module: NotificationModule.EXPENSE,
                type: NotificationType.INFO,
                title: `Expense ${updated.referenceNo} paid`,
                message: `${updated.title} recorded as paid by ${updated.paidByEmployee?.firstName ?? "Finance"}.`,
                resourceType: "EXPENSE",
                resourceId: updated.id,
                targets: {
                    roleNames: ["FINANCE"],
                    excludeUserIds: currentUserId ? [currentUserId] : undefined,
                },
            });
        }
        catch (notifyError) {
            console.warn("Failed to send expense payment notification:", notifyError);
        }
        return res.json(updated);
    }
    catch (error) {
        console.error("Pay expense error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to mark expense as paid" });
    }
}
/**
 * Upload receipt
 */
export async function uploadReceipt(req, res) {
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const expense = await prisma.expense.findUnique({
            where: { id },
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        // Store file path (relative to uploads directory)
        const receiptUrl = `/uploads/expenses/${file.filename}`;
        const updated = await prisma.expense.update({
            where: { id },
            data: {
                receiptUrl,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        console.error("Upload receipt error:", error);
        return res.status(500).json({ message: "Failed to upload receipt" });
    }
}
//# sourceMappingURL=expense.controller.js.map