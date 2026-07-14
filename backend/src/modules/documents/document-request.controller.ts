import { Request, Response } from "express";
import { Prisma, NotificationModule, NotificationType } from "@prisma/client";
import prisma from "../../db/client.js";
import {
  CreateDocumentRequestDto,
  UpdateDocumentRequestDto,
  ListDocumentRequestsQuery,
  type CreateDocumentRequestData,
  type UpdateDocumentRequestData,
} from "./document-request.dto.js";
import { paginate } from "../../utils/pagination.js";
import { processTemplate } from "./template-engine.js";
import { generatePDFFromHTML, generateDocumentFileName } from "./pdf-generator.js";
import { sendGeneratedDocument } from "./email-service.js";
import { NotificationService } from "../notifications/notification.service.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

/**
 * Create document request
 */
export async function createDocumentRequest(req: Request, res: Response) {
  try {
    const currentUserId = getCurrentUserId(req);
    const data = CreateDocumentRequestDto.parse(req.body);

    // Get current user's employee record
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { employee: true },
    });

    if (!currentUser?.employee) {
      return res.status(400).json({ message: "User is not linked to an employee" });
    }

    // Verify template exists and is active
    const template = await prisma.documentTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (!template.active || template.status !== "ACTIVE") {
      return res.status(400).json({ message: "Template is not available for requests" });
    }

    // Create request
    const documentRequest = await prisma.documentRequest.create({
      data: {
        employeeId: currentUser.employee.id,
        templateId: data.templateId,
        purpose: data.purpose,
        priority: data.priority || "NORMAL",
        status: "PENDING",
        requestedBy: currentUserId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    try {
      await NotificationService.sendNotification({
        module: NotificationModule.DOCUMENT,
        type: NotificationType.INFO,
        title: `Document request submitted`,
        message: `${currentUser.employee.firstName} ${currentUser.employee.lastName} requested ${documentRequest.template.name}.`,
        resourceType: "DOCUMENT_REQUEST",
        resourceId: documentRequest.id,
        targets: {
          roleNames: ["HR", "MANAGER"],
          excludeUserIds: [currentUserId],
        },
      });
    } catch (notifyError) {
      console.warn("Failed to send document request notification:", notifyError);
    }

    return res.status(201).json(documentRequest);
  } catch (error: any) {
    console.error("Create document request error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create document request" });
  }
}

/**
 * List document requests
 */
export async function listDocumentRequests(req: Request, res: Response) {
  try {
    const query = ListDocumentRequestsQuery.parse(req.query);
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

    const where: Prisma.DocumentRequestWhereInput = {};

    // Access control: Employees can only see their own requests, Admin/HR can see all
    if (!isAdminOrHR && currentUser?.employee) {
      where.employeeId = currentUser.employee.id;
    }

    // Filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.employeeId && isAdminOrHR) {
      where.employeeId = query.employeeId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.search) {
      where.OR = [
        { purpose: { contains: query.search, mode: "insensitive" } },
        {
          employee: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { employeeCode: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
        {
          template: {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { code: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    const [requests, total] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
            },
          },
          requestedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          generatedDocument: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
      }),
      prisma.documentRequest.count({ where }),
    ]);

    return res.status(200).json({
      items: requests,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List document requests error:", error);
    return res.status(500).json({ message: "Failed to list document requests" });
  }
}

/**
 * Get document request by ID
 */
export async function getDocumentRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);

    const request = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
          },
        },
        template: true,
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        generatedDocument: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            format: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    // Access control: Check if user can view this request
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        userRoles: {
          include: { role: true },
        },
        employee: { select: { id: true } },
      },
    });

    const isAdminOrHR = currentUser?.userRoles.some(
      (ur) => ur.role.name.toUpperCase() === "ADMIN" || ur.role.name.toUpperCase() === "HR"
    ) || false;

    if (!isAdminOrHR && currentUser?.employee?.id !== request.employeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(request);
  } catch (error: any) {
    console.error("Get document request error:", error);
    return res.status(500).json({ message: "Failed to get document request" });
  }
}

/**
 * Update document request (approve/reject/generate)
 */
export async function updateDocumentRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const data = UpdateDocumentRequestDto.parse(req.body);

    // Check if user has permission (Admin/HR only)
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const isAdminOrHR = currentUser?.userRoles.some(
      (ur) => ur.role.name.toUpperCase() === "ADMIN" || ur.role.name.toUpperCase() === "HR"
    ) || false;

    if (!isAdminOrHR) {
      return res.status(403).json({ message: "Access denied" });
    }

  const existingRequest = await prisma.documentRequest.findUnique({
    where: { id },
    include: {
      employee: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
      template: true,
    },
  });

    if (!existingRequest) {
      return res.status(404).json({ message: "Document request not found" });
    }

    const updateData: any = {
      notes: data.notes,
    };

    // Handle status changes
    if (data.status) {
      if (data.status === "APPROVED") {
        updateData.status = "APPROVED";
        updateData.approvedBy = currentUserId;
        updateData.approvedAt = new Date();
        updateData.rejectedBy = null;
        updateData.rejectedAt = null;
        updateData.rejectionReason = null;
      } else if (data.status === "REJECTED") {
        updateData.status = "REJECTED";
        updateData.rejectedBy = currentUserId;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = data.rejectionReason;
        updateData.approvedBy = null;
        updateData.approvedAt = null;
      } else {
        updateData.status = data.status;
      }
    }

    // If approved and generating, create the document
    if (data.status === "GENERATED" && existingRequest.status === "APPROVED") {
      try {
        // Process template
        const processedContent = await processTemplate(
          existingRequest.template.content,
          existingRequest.employeeId,
          undefined,
          false
        );

        // Generate PDF
        const fileName = generateDocumentFileName(
          existingRequest.template.code,
          existingRequest.employee.employeeCode
        );
        const pdfResult = await generatePDFFromHTML(processedContent, fileName);

        // Save generated document
        const generatedDoc = await prisma.generatedDocument.create({
          data: {
            templateId: existingRequest.templateId,
            employeeId: existingRequest.employeeId,
            generatedBy: currentUserId,
            generatedFor: existingRequest.employeeId,
            fileUrl: pdfResult.filePath,
            fileName: pdfResult.fileName,
            format: "pdf",
            fileSize: pdfResult.fileSize,
            meta: {
              templateCode: existingRequest.template.code,
              templateName: existingRequest.template.name,
              employeeCode: existingRequest.employee.employeeCode,
              requestId: id,
            },
          },
        });

        // Send email to employee
        try {
          const fullFilePath = pdfResult.filePath.startsWith("/")
            ? pdfResult.filePath.substring(1)
            : pdfResult.filePath;
        const absolutePath = path.join(
          __dirname,
          "../../../",
          fullFilePath
        );

          await sendGeneratedDocument(
            existingRequest.employee.email,
            `${existingRequest.employee.firstName} ${existingRequest.employee.lastName}`,
            generatedDoc.fileName,
            existingRequest.template.name,
            absolutePath,
            generatedDoc.fileName
          );
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }

        updateData.generatedDocumentId = generatedDoc.id;
        updateData.status = "GENERATED";
      } catch (generateError: any) {
        console.error("Failed to generate document:", generateError);
        return res.status(500).json({
          message: "Failed to generate document",
          error: generateError.message,
        });
      }
    }

    const updatedRequest = await prisma.documentRequest.update({
      where: { id },
      data: updateData,
      include: {
      employee: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
        template: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        generatedDocument: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
      },
    });

  try {
    const recipientUserId =
      existingRequest.employee?.user?.id ?? updatedRequest.employee?.user?.id;

    if (updatedRequest.status === "APPROVED" && recipientUserId) {
      await NotificationService.sendNotification({
        module: NotificationModule.DOCUMENT,
        type: NotificationType.SUCCESS,
        title: "Document request approved",
        message: `${updatedRequest.template.name} request approved.`,
        resourceType: "DOCUMENT_REQUEST",
        resourceId: updatedRequest.id,
        targets: {
          userIds: [recipientUserId],
        },
      });
    } else if (updatedRequest.status === "REJECTED" && recipientUserId) {
      await NotificationService.sendNotification({
        module: NotificationModule.DOCUMENT,
        type: NotificationType.WARNING,
        title: "Document request rejected",
        message: updatedRequest.rejectionReason
          ? `Request rejected: ${updatedRequest.rejectionReason}`
          : "Your document request was rejected.",
        resourceType: "DOCUMENT_REQUEST",
        resourceId: updatedRequest.id,
        targets: {
          userIds: [recipientUserId],
        },
      });
    } else if (updatedRequest.status === "GENERATED" && recipientUserId) {
      await NotificationService.sendNotification({
        module: NotificationModule.DOCUMENT,
        type: NotificationType.SUCCESS,
        title: "Document ready",
        message: `${updatedRequest.template.name} has been generated.`,
        resourceType: "DOCUMENT_REQUEST",
        resourceId: updatedRequest.id,
        targets: {
          userIds: [recipientUserId],
        },
      });
    }
  } catch (notifyError) {
    console.warn("Failed to send document request notification:", notifyError);
  }

    return res.status(200).json(updatedRequest);
  } catch (error: any) {
    console.error("Update document request error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update document request" });
  }
}

/**
 * Delete/Cancel document request
 */
export async function deleteDocumentRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);

    const request = await prisma.documentRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    // Only allow cancellation if status is PENDING
    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: "Cannot cancel request that is not pending",
      });
    }

    // Check if user owns the request or is Admin/HR
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        userRoles: {
          include: { role: true },
        },
        employee: { select: { id: true } },
      },
    });

    const isAdminOrHR = currentUser?.userRoles.some(
      (ur) => ur.role.name.toUpperCase() === "ADMIN" || ur.role.name.toUpperCase() === "HR"
    ) || false;

    if (!isAdminOrHR && currentUser?.employee?.id !== request.employeeId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.documentRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json({ message: "Request cancelled successfully" });
  } catch (error: any) {
    console.error("Delete document request error:", error);
    return res.status(500).json({ message: "Failed to cancel document request" });
  }
}

