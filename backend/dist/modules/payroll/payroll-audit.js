/**
 * Create an audit log entry for payroll actions
 */
export async function createAuditLog(prisma, data) {
    try {
        // Try to get user info if performedBy is provided
        let userEmail = data.userEmail;
        let userName = data.userName;
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
            }
            catch (error) {
                // If user lookup fails, continue without user info
                console.warn("Failed to fetch user info for audit log:", error);
            }
        }
        // Skip audit log creation if performedBy is not provided
        if (!data.performedBy) {
            console.warn("Skipping audit log creation: performedBy is required but not provided");
            return null;
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
    }
    catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw - audit logging should not break the main operation
        return null;
    }
}
//# sourceMappingURL=payroll-audit.js.map