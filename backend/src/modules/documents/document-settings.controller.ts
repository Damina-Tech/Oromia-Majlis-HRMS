import { Request, Response } from "express";
import prisma from "../../db/client.js";

import {
  CreateDocumentSettingsDto,
  UpdateDocumentSettingsDto,
  type CreateDocumentSettingsData,
  type UpdateDocumentSettingsData,
} from "./document-settings.dto.js";

function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

/**
 * Get current document settings
 */
export async function getDocumentSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.documentSettings.findFirst({
      where: { isActive: true },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!settings) {
      return res.status(404).json({ message: "Document settings not found" });
    }

    return res.status(200).json(settings);
  } catch (error: any) {
    console.error("Get document settings error:", error);
    return res.status(500).json({ message: "Failed to get document settings" });
  }
}

/**
 * Create document settings
 */
export async function createDocumentSettings(req: Request, res: Response) {
  try {
    const currentUserId = getCurrentUserId(req);
    const data = CreateDocumentSettingsDto.parse(req.body);

    // Deactivate existing settings
    await prisma.documentSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings
    const settings = await prisma.documentSettings.create({
      data: {
        ...data,
        createdBy: currentUserId,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(settings);
  } catch (error: any) {
    console.error("Create document settings error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create document settings" });
  }
}

/**
 * Update document settings
 */
export async function updateDocumentSettings(req: Request, res: Response) {
  try {
    const currentUserId = getCurrentUserId(req);
    const data = UpdateDocumentSettingsDto.parse(req.body);

    const existingSettings = await prisma.documentSettings.findFirst({
      where: { isActive: true },
    });

    if (!existingSettings) {
      return res.status(404).json({ message: "Document settings not found" });
    }

    const settings = await prisma.documentSettings.update({
      where: { id: existingSettings.id },
      data: {
        ...data,
        updatedBy: currentUserId,
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(settings);
  } catch (error: any) {
    console.error("Update document settings error:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update document settings" });
  }
}

