import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Create an audit log entry for payroll actions
 */
export async function createAuditLog(
  prisma: PrismaClient | Prisma.TransactionClient,
  data: {
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
  }
) {
  try {
    // Try to get user info if performedBy is provided
    let userEmail: string | undefined = data.userEmail;
    let userName: string | undefined = data.userName;

    if (data.performedBy && !userEmail) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: data.performedBy },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        if (user) {
          userEmail = user.email;
          userName = `${user.firstName} ${user.lastName}`;
        }
      } catch (error) {
        // If user lookup fails, continue without user info
        console.warn("Failed to fetch user info for audit log:", error);
      }
    }

    const auditLog = await prisma.payrollAuditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        payrollRunId: data.payrollRunId,
        performedBy: data.performedBy,
        userEmail,
        userName,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        description: data.description || `${data.action} ${data.entityType}`,
      },
    });

    return auditLog;
  } catch (error: any) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main operation
    return null;
  }
}

