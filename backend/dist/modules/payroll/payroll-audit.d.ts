import { PrismaClient, Prisma } from "@prisma/client";
/**
 * Create an audit log entry for payroll actions
 */
export declare function createAuditLog(prisma: PrismaClient | Prisma.TransactionClient, data: {
    action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "PROCESS" | "EXPORT" | "GENERATE";
    entityType: string;
    entityId: string;
    payrollRunId?: string;
    performedBy?: string;
    userEmail?: string;
    userName?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    description: string | null;
    action: import(".prisma/client").$Enums.AuditAction;
    payrollRunId: string | null;
    entityType: string;
    entityId: string;
    performedBy: string;
    userEmail: string | null;
    userName: string | null;
    oldValue: string | null;
    newValue: string | null;
} | null>;
//# sourceMappingURL=payroll-audit.d.ts.map