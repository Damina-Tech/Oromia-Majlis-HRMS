/**
 * Generate PDF from HTML content using pdfkit
 * Note: This is a basic implementation. For complex HTML/CSS, consider using puppeteer
 */
export declare function generatePDFFromHTML(htmlContent: string, outputFileName: string): Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
}>;
/**
 * Generate PDF filename
 */
export declare function generateDocumentFileName(templateCode: string, employeeCode: string | null, extension?: string): string;
/**
 * Clean up old generated documents (for retention policies)
 */
export declare function cleanupOldDocuments(olderThanDays: number): Promise<number>;
//# sourceMappingURL=pdf-generator.d.ts.map