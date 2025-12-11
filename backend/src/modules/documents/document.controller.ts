import { Request, Response } from "express";
import { PrismaClient, Prisma, NotificationModule, NotificationType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  ListTemplatesQuery,
  GenerateDocumentDto,
  PreviewDocumentDto,
  ListGeneratedDocumentsQuery,
} from "./document.dto.js";
import { processTemplate, extractMergeFields } from "./template-engine.js";
import { generatePDFFromHTML, generateDocumentFileName } from "./pdf-generator.js";
import { paginate } from "../../utils/pagination.js";
import { sendGeneratedDocument } from "./email-service.js";
import { NotificationService } from "../notifications/notification.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper function to get current user ID
function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

/**
 * List document templates
 */
export async function listTemplates(req: Request, res: Response) {
  try {
    const query = ListTemplatesQuery.parse(req.query);

    const where: Prisma.DocumentTemplateWhereInput = {};

    // Search
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Filters
    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.tags) {
      const tagArray = query.tags.split(",").map((t) => t.trim());
      where.tags = { hasSome: tagArray };
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    const orderBy: Prisma.DocumentTemplateOrderByWithRelationInput = {};
    orderBy[query.sortBy] = query.sortOrder;

    const [templates, total] = await Promise.all([
      prisma.documentTemplate.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              generatedDocuments: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.documentTemplate.count({ where }),
    ]);

    return res.status(200).json({
      items: templates,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List templates error:", error);
    return res.status(500).json({ message: "Failed to list templates" });
  }
}

/**
 * Get single template
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Extract merge fields from content
    const mergeFields = extractMergeFields(template.content);

    return res.status(200).json({
      ...template,
      mergeFields,
    });
  } catch (error: any) {
    console.error("Get template error:", error);
    return res.status(500).json({ message: "Failed to get template" });
  }
}

/**
 * Create new template
 */
export async function createTemplate(req: Request, res: Response) {
  try {
    const data = CreateDocumentTemplateDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if code already exists
    const existing = await prisma.documentTemplate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(409).json({ message: "Template code already exists" });
    }

    // Extract merge fields from content
    const mergeFields = extractMergeFields(data.content);

    const template = await prisma.documentTemplate.create({
      data: {
        ...data,
        createdBy: currentUserId,
        mergeFields: mergeFields.length > 0 ? ({ fields: mergeFields } as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        templateId: template.id,
        action: "create_template",
        actorId: currentUserId,
        targetId: template.id,
        details: { name: template.name, code: template.code },
      },
    });

    return res.status(201).json(template);
  } catch (error: any) {
    console.error("Create template error:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Template code already exists" });
    }
    return res.status(500).json({ message: "Failed to create template" });
  }
}

/**
 * Update template
 */
export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateDocumentTemplateDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existing = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Extract merge fields if content is updated
    let mergeFields = existing.mergeFields;
    if (data.content) {
      const fields = extractMergeFields(data.content);
      mergeFields = fields.length > 0 ? { fields } : null;
    }

    const template = await prisma.documentTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedBy: currentUserId,
        version: data.content ? existing.version + 1 : existing.version,
        mergeFields: mergeFields ? (mergeFields as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        templateId: template.id,
        action: "update_template",
        actorId: currentUserId,
        targetId: template.id,
        details: { name: template.name, version: template.version },
      },
    });

    return res.status(200).json(template);
  } catch (error: any) {
    console.error("Update template error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Template not found" });
    }
    return res.status(500).json({ message: "Failed to update template" });
  }
}

/**
 * Delete template
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    await prisma.documentTemplate.delete({
      where: { id },
    });

    // Create audit log
    await prisma.documentAuditLog.create({
      data: {
        templateId: id,
        action: "delete_template",
        actorId: currentUserId,
        targetId: id,
        details: { name: template.name },
      },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete template error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Template not found" });
    }
    return res.status(500).json({ message: "Failed to delete template" });
  }
}

/**
 * Preview template with sample or real data
 */
export async function previewTemplate(req: Request, res: Response) {
  try {
    const data = PreviewDocumentDto.parse(req.body);

    const template = await prisma.documentTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (!template.active) {
      return res.status(400).json({ message: "Template is not active" });
    }

    // Process template with merge fields
    const processedContent = await processTemplate(
      template.content,
      data.employeeId,
      data.mergeData,
      data.useSampleData || !data.employeeId
    );

    return res.status(200).json({
      original: template.content,
      processed: processedContent,
      template: {
        id: template.id,
        name: template.name,
        code: template.code,
      },
    });
  } catch (error: any) {
    console.error("Preview template error:", error);
    return res.status(500).json({ message: "Failed to preview template" });
  }
}

/**
 * Generate document(s) from template
 */
export async function generateDocument(req: Request, res: Response) {
  try {
    const data = GenerateDocumentDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (!template.active || template.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Template is not active or not in ACTIVE status",
      });
    }

    // Determine employee IDs to process
    let employeeIds: string[] = [];

    if (data.employeeId) {
      employeeIds = [data.employeeId];
    } else if (data.employeeIds && data.employeeIds.length > 0) {
      employeeIds = data.employeeIds;
    } else if (data.departmentId) {
      // Get all employees in department
      const employees = await prisma.employee.findMany({
        where: { departmentId: data.departmentId, status: "ACTIVE" },
        select: { id: true },
      });
      employeeIds = employees.map((e) => e.id);
    } else {
      return res.status(400).json({
        message: "Either employeeId, employeeIds, or departmentId must be provided",
      });
    }

    if (employeeIds.length === 0) {
      return res.status(400).json({ message: "No employees found to generate documents for" });
    }

    // Generate documents for each employee
    const generatedDocuments = [];

    for (const employeeId of employeeIds) {
      // Process template
      const processedContent = await processTemplate(
        template.content,
        employeeId,
        data.mergeData,
        false
      );

      // Get employee for filename and email
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      // Generate PDF
      const fileName = generateDocumentFileName(
        template.code,
        employee?.employeeCode || null
      );

      const pdfResult = await generatePDFFromHTML(processedContent, fileName);

      // Save generated document record
      const generatedDoc = await prisma.generatedDocument.create({
        data: {
          templateId: template.id,
          employeeId,
          generatedBy: currentUserId,
          generatedFor: employeeId,
          fileUrl: pdfResult.filePath,
          fileName: pdfResult.fileName,
          format: data.format,
          fileSize: pdfResult.fileSize,
          meta: {
            templateCode: template.code,
            templateName: template.name,
            mergeData: data.mergeData || {},
          },
        },
      });

      generatedDocuments.push(generatedDoc);

      try {
        if (employee?.user?.id) {
          await NotificationService.sendNotification({
            module: NotificationModule.DOCUMENT,
            type: NotificationType.INFO,
            title: `Document generated: ${template.name}`,
            message: `A new ${template.name} document has been generated for you.`,
            resourceType: "DOCUMENT",
            resourceId: generatedDoc.id,
            targets: {
              userIds: [employee.user.id],
            },
            data: {
              fileName: generatedDoc.fileName,
            },
          });
        }
      } catch (notifyError) {
        console.warn("Failed to send document notification:", notifyError);
      }

      // Send email if requested
      if (data.email && employee && employee.email) {
        try {
          // Resolve full file path for email attachment
          const fullFilePath = path.isAbsolute(pdfResult.filePath)
            ? pdfResult.filePath
            : path.join(__dirname, "../../../", pdfResult.filePath.replace(/^\//, ""));
          
          await sendGeneratedDocument(
            employee.email,
            `${employee.firstName} ${employee.lastName}`,
            generatedDoc.fileName,
            template.name,
            fullFilePath,
            generatedDoc.fileName
          );

          // Create audit log for email
          await prisma.documentAuditLog.create({
            data: {
              templateId: template.id,
              documentId: generatedDoc.id,
              action: "email_sent",
              actorId: currentUserId,
              targetId: generatedDoc.id,
              details: {
                employeeId,
                email: employee.email,
              },
            },
          });
        } catch (emailError: any) {
          console.error("Failed to send email:", emailError);
          // Don't fail the generation if email fails
        }
      }

      // Create audit log for generation
      await prisma.documentAuditLog.create({
        data: {
          templateId: template.id,
          documentId: generatedDoc.id,
          action: "generate",
          actorId: currentUserId,
          targetId: generatedDoc.id,
          details: {
            employeeId,
            fileName: generatedDoc.fileName,
            format: data.format,
            emailSent: data.email || false,
          },
        },
      });
    }

    return res.status(201).json({
      message: `Successfully generated ${generatedDocuments.length} document(s)`,
      documents: generatedDocuments,
    });
  } catch (error: any) {
    console.error("Generate document error:", error);
    return res.status(500).json({ message: "Failed to generate document" });
  }
}

/**
 * List generated documents
 */
export async function listGeneratedDocuments(req: Request, res: Response) {
  try {
    const query = ListGeneratedDocumentsQuery.parse(req.query);
    const currentUserId = getCurrentUserId(req);
    
    // Get current user's role and employee ID for access control
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: {
          select: { id: true },
        },
      },
    });

    const isAdminOrHR = currentUser?.userRoles.some(
      (ur) => ur.role.name.toUpperCase() === "ADMIN" || ur.role.name.toUpperCase() === "HR"
    ) || false;

    const where: Prisma.GeneratedDocumentWhereInput = {};

    // Access control: Employees can only see their own documents, Admin/HR can see all
    if (!isAdminOrHR && currentUser?.employee) {
      where.employeeId = currentUser.employee.id;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.employeeId) {
      // Only allow filtering by employeeId if user is Admin/HR
      if (isAdminOrHR) {
        where.employeeId = query.employeeId;
      }
    }

    if (query.generatedBy) {
      where.generatedBy = query.generatedBy;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    // Search functionality
    if (query.search) {
      where.OR = [
        { fileName: { contains: query.search, mode: "insensitive" } },
        {
          template: {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { code: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
        {
          employee: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { employeeCode: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    const orderBy: Prisma.GeneratedDocumentOrderByWithRelationInput = {};
    orderBy[query.sortBy] = query.sortOrder;

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
          generatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.generatedDocument.count({ where }),
    ]);

    return res.status(200).json({
      items: documents,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List generated documents error:", error);
    return res.status(500).json({ message: "Failed to list generated documents" });
  }
}

/**
 * Download generated document
 */
export async function downloadDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const document = await prisma.generatedDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Construct full file path
    const filePath = path.join(__dirname, "../../../", document.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    return res.download(filePath, document.fileName);
  } catch (error: any) {
    console.error("Download document error:", error);
    return res.status(500).json({ message: "Failed to download document" });
  }
}

/**
 * Get available merge fields
 */
export async function getMergeFields(req: Request, res: Response) {
  try {
    const mergeFields = {
      employee: {
        firstName: "Employee first name",
        lastName: "Employee last name",
        fullName: "Employee full name",
        email: "Employee email",
        phone: "Employee phone",
        employeeCode: "Employee code",
        designation: "Employee designation/job title",
        department: "Department name",
        joiningDate: "Joining date (formatted)",
        salary: "Employee salary",
        address: "Employee address",
        dateOfBirth: "Date of birth (formatted)",
        gender: "Gender",
        manager: "Manager name",
        salaryGrade: "Salary grade",
        salaryStep: "Salary step amount",
      },
      department: {
        name: "Department name",
        manager: "Department manager name",
      },
      payroll: {
        basicSalary: "Basic salary",
        grossSalary: "Gross salary",
        netSalary: "Net salary",
        allowances: "Total allowances",
        deductions: "Total deductions",
        incomeTax: "Income tax",
        pension: "Pension contribution",
        period: "Payroll period",
      },
      company: {
        name: "Company name",
        address: "Company address",
        phone: "Company phone",
        email: "Company email",
      },
      date: {
        today: "Today's date (formatted)",
        formatted: "Today's date (simple format)",
        year: "Current year",
        month: "Current month",
        day: "Current day",
      },
    };

    return res.status(200).json(mergeFields);
  } catch (error: any) {
    console.error("Get merge fields error:", error);
    return res.status(500).json({ message: "Failed to get merge fields" });
  }
}

