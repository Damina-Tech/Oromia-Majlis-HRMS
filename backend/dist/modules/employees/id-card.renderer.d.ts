import type { Employee, EmployeeIdTemplate } from "@prisma/client";
import type { IdCardTemplateSettings } from "./employee.dto.js";
type RenderOptions = {
    employee: Employee & {
        department?: {
            name: string | null;
        } | null;
    };
    template: EmployeeIdTemplate;
    settings: IdCardTemplateSettings;
    issueDate: Date;
    expiryDate?: Date | null;
    codeType?: "QR" | "BARCODE" | "NONE";
};
type GeneratedAssets = {
    pngPath: string;
    pdfPath: string;
    pngUrl: string;
    pdfUrl: string;
    metadata: Record<string, unknown>;
    codeType: string;
};
export declare function generateIdCardAssets(options: RenderOptions): Promise<GeneratedAssets>;
export {};
//# sourceMappingURL=id-card.renderer.d.ts.map