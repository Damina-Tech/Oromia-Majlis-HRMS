/**
 * Verify email configuration
 */
export declare function verifyEmailConfig(): Promise<boolean>;
/**
 * Send document via email
 */
export declare function sendDocumentEmail(to: string, subject: string, body: string, attachmentPath?: string, attachmentName?: string): Promise<void>;
/**
 * Send generated document to employee
 */
export declare function sendGeneratedDocument(employeeEmail: string, employeeName: string, documentName: string, templateName: string, filePath: string, fileName: string): Promise<void>;
/**
 * Test email configuration
 */
export declare function testEmailConnection(): Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=email-service.d.ts.map