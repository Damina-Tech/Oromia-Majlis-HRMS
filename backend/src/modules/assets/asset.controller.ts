import { Request, Response } from "express";
import {
  PrismaClient,
  Prisma,
  NotificationModule,
  NotificationType,
} from "@prisma/client";
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssignAssetDto,
  ReturnAssetDto,
  ListAssetsQuery,
  AssetStatsQuery,
  AssetHistoryQuery,
  BulkUpdateAssetsDto,
} from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";
import { NotificationService } from "../notifications/notification.service.js";
import { generateAssetCode } from "./asset-utils.js";

const prisma = new PrismaClient();

// Helper function to get current user ID
function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

// Helper function to get current user roles
function getCurrentUserRoles(req: Request): string[] {
  return (req as any).user?.roles || [];
}

/**
 * List assets with filtering and pagination
 */
export async function listAssets(req: Request, res: Response) {
  try {
    const query = ListAssetsQuery.parse(req.query);
    const userRoles = getCurrentUserRoles(req);
    
    // Build where clause
    const where: Prisma.AssetWhereInput = {};

    // Search functionality
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { assetCode: { contains: query.search, mode: "insensitive" } },
        { serialNumber: { contains: query.search, mode: "insensitive" } },
        { model: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Filter by category
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by condition
    if (query.condition) {
      where.condition = query.condition;
    }

    // Filter by location
    if (query.locationId) {
      where.locationId = query.locationId;
    }

    // Filter by department
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    // Filter by assigned employee
    if (query.assignedToEmployeeId) {
      where.assignedToEmployeeId = query.assignedToEmployeeId;
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    // Build orderBy clause
    const orderBy: Prisma.AssetOrderByWithRelationInput = {};
    orderBy[query.sortBy] = query.sortOrder;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: true,
          location: true,
          vendor: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              history: true,
              assignments: true,
              maintenance: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.asset.count({ where }),
    ]);

    return res.status(200).json({
      items: assets,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List assets error:", error);
    console.error("Error details:", error.message, error.stack);
    return res.status(500).json({ 
      message: "Failed to list assets",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get single asset by ID
 */
export async function getAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
            email: true,
            phone: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            assignedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
          take: 1,
        },
        history: {
          include: {
            fromEmployee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
            toEmployee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
            performedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50, // Limit to last 50 history entries
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    return res.status(200).json(asset);
  } catch (error: any) {
    console.error("Get asset error:", error);
    return res.status(500).json({ message: "Failed to get asset" });
  }
}

/**
 * Create new asset
 */
export async function createAsset(req: Request, res: Response) {
  try {
    const data = CreateAssetDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if serial number already exists (if provided)
    if (data.serialNumber) {
      const existingAsset = await prisma.asset.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (existingAsset) {
        return res.status(409).json({ message: "Asset with this serial number already exists" });
      }
    }

    // Generate asset code
    const assetCode = await generateAssetCode(data.categoryId);

    // Create asset with history entry
    const asset = await prisma.$transaction(async (tx) => {
      const newAsset = await tx.asset.create({
        data: {
          assetCode,
          name: data.name,
          categoryId: data.categoryId,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serialNumber || null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : null,
          currency: data.currency || "USD",
          vendorId: data.vendorId || null,
          warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
          locationId: data.locationId || null,
          departmentId: data.departmentId || null,
          condition: data.condition || "NEW",
          status: "IN_STOCK",
          depreciationMethod: data.depreciationMethod || null,
          depreciationRate: data.depreciationRate ? new Prisma.Decimal(data.depreciationRate) : null,
          lifeYears: data.lifeYears ? new Prisma.Decimal(data.lifeYears) : null,
          notes: data.notes,
          createdBy: currentUserId,
        },
        include: {
          category: true,
          location: true,
          vendor: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: newAsset.id,
          action: "CREATED",
          description: `Asset ${newAsset.name} created`,
          performedBy: currentUserId,
        },
      });

      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId: newAsset.id,
          changedBy: currentUserId,
          changeSummary: `Asset created: ${newAsset.name} (${assetCode})`,
        },
      });

      return newAsset;
    });

    return res.status(201).json(asset);
  } catch (error: any) {
    console.error("Create asset error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Asset with this serial number or asset code already exists" });
      }
    }
    return res.status(500).json({ message: "Failed to create asset" });
  }
}

/**
 * Update asset
 */
export async function updateAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateAssetDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Track changes for history
    const changes: string[] = [];
    
    if (data.name && data.name !== existingAsset.name) {
      changes.push(`Name: ${existingAsset.name} → ${data.name}`);
    }
    if (data.status && data.status !== existingAsset.status) {
      changes.push(`Status: ${existingAsset.status} → ${data.status}`);
    }
    if (data.condition && data.condition !== existingAsset.condition) {
      changes.push(`Condition: ${existingAsset.condition} → ${data.condition}`);
    }

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const asset = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.model !== undefined) updateData.model = data.model;
      if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
      if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
      if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : null;
      if (data.currency) updateData.currency = data.currency;
      if (data.vendorId !== undefined) updateData.vendorId = data.vendorId || null;
      if (data.warrantyUntil) updateData.warrantyUntil = new Date(data.warrantyUntil);
      if (data.locationId !== undefined) updateData.locationId = data.locationId || null;
      if (data.departmentId !== undefined) updateData.departmentId = data.departmentId || null;
      if (data.condition) updateData.condition = data.condition;
      if (data.status) updateData.status = data.status;
      if (data.depreciationMethod !== undefined) updateData.depreciationMethod = data.depreciationMethod || null;
      if (data.depreciationRate !== undefined) updateData.depreciationRate = data.depreciationRate ? new Prisma.Decimal(data.depreciationRate) : null;
      if (data.lifeYears !== undefined) updateData.lifeYears = data.lifeYears ? new Prisma.Decimal(data.lifeYears) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const updatedAsset = await tx.asset.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          location: true,
          vendor: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });

      // Create history entry if there were changes
      if (changes.length > 0) {
        await tx.assetHistory.create({
          data: {
            assetId: id,
            action: "STATUS_CHANGED",
            description: `Asset updated: ${changes.join(", ")}`,
            previousStatus: existingAsset.status,
            newStatus: data.status || existingAsset.status,
            previousCondition: existingAsset.condition,
            newCondition: data.condition || existingAsset.condition,
            performedBy: currentUserId,
          },
        });
      }

      // Create audit log if significant changes
      if (changes.length > 0) {
        await tx.assetAuditLog.create({
          data: {
            assetId: id,
            changedBy: currentUserId,
            changeSummary: `Asset updated: ${changes.join("; ")}`,
          },
        });
      }

      return updatedAsset;
    });

    return res.status(200).json(asset);
  } catch (error: any) {
    console.error("Update asset error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Asset with this serial number already exists" });
      }
    }
    return res.status(500).json({ message: "Failed to update asset" });
  }
}

/**
 * Assign asset to employee
 */
export async function assignAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = AssignAssetDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "IN_STOCK") {
      return res.status(400).json({ message: "Asset is not available for assignment" });
    }

    // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
    include: {
      department: true,
      user: {
        select: { id: true },
      },
    },
  });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee already has this asset assigned
    if (asset.assignedToEmployeeId === data.employeeId) {
      return res.status(400).json({ message: "Asset is already assigned to this employee" });
    }

  const result = await prisma.$transaction(async (tx) => {
      // Create assignment record
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: id,
          employeeId: data.employeeId,
          assignedAt: new Date(),
          assignedBy: currentUserId,
          note: data.note,
        },
      });

      // Update asset
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: "ASSIGNED",
          assignedToEmployeeId: data.employeeId,
        },
        include: {
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          category: true,
          location: true,
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: id,
          action: "ASSIGNED",
          description: data.note || `Asset assigned to ${employee.firstName} ${employee.lastName}`,
          toEmployeeId: data.employeeId,
          performedBy: currentUserId,
        },
      });

      return { ...updatedAsset, assignment };
    });

  try {
    if (employee.user?.id) {
      await NotificationService.sendNotification({
        module: NotificationModule.ASSET,
        type: NotificationType.INFO,
        title: `Asset assigned: ${result.name}`,
        message: `You have been assigned asset ${result.name}.`,
        resourceType: "ASSET",
        resourceId: result.id,
        targets: {
          userIds: [employee.user.id],
        },
        data: {
          assetId: result.id,
          assetCode: result.assetCode,
        },
      });
    }

    await NotificationService.sendNotification({
      module: NotificationModule.ASSET,
      type: NotificationType.INFO,
      title: `Asset ${result.assetCode || result.name} assigned`,
      message: `${result.name} assigned to ${employee.firstName} ${employee.lastName}.`,
      resourceType: "ASSET",
      resourceId: result.id,
      targets: {
        roleNames: ["ADMIN", "HR"],
        excludeUserIds: currentUserId ? [currentUserId] : undefined,
      },
    });
  } catch (notifyError) {
    console.warn("Failed to send asset assignment notification:", notifyError);
  }

  return res.status(200).json(result);
  } catch (error: any) {
    console.error("Assign asset error:", error);
    return res.status(500).json({ message: "Failed to assign asset" });
  }
}

export async function returnAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = ReturnAssetDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedEmployee: true,
        assignments: {
          where: {
            returnedAt: null,
          },
          orderBy: {
            assignedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    if (asset.assignments.length === 0) {
      return res.status(400).json({ message: "No active assignment found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Mark assignment as returned
      const assignment = asset.assignments[0];
      await tx.assetAssignment.update({
        where: { id: assignment.id },
        data: {
          returnedAt: new Date(),
          note: data.note || assignment.note,
        },
      });

      // Update asset
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: "IN_STOCK",
          assignedToEmployeeId: null,
        },
        include: {
          category: true,
          location: true,
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: id,
          action: "REVOKED",
          description: data.note || `Asset returned from ${asset.assignedEmployee?.firstName} ${asset.assignedEmployee?.lastName}`,
          fromEmployeeId: assignment.employeeId,
          performedBy: currentUserId,
        },
      });

      return updatedAsset;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Return asset error:", error);
    return res.status(500).json({ message: "Failed to return asset" });
  }
}

/**
 * Revoke asset assignment
 */
export async function revokeAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const currentUserId = getCurrentUserId(req);

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: "AVAILABLE",
          assignedTo: null,
          assignedDate: null,
          assignedBy: null,
        },
        include: {
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: id,
          action: "REVOKED",
          description: notes || `Asset assignment revoked from ${asset.assignedEmployee?.firstName} ${asset.assignedEmployee?.lastName}`,
          fromEmployeeId: asset.assignedTo,
          performedBy: currentUserId,
        },
      });

      return updatedAsset;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Revoke asset error:", error);
    return res.status(500).json({ message: "Failed to revoke asset assignment" });
  }
}

/**
 * Transfer asset to another employee
 */
export async function transferAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = TransferAssetDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    // Check if target employee exists
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: data.toEmployeeId },
    });

    if (!targetEmployee) {
      return res.status(404).json({ message: "Target employee not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          assignedTo: data.toEmployeeId,
          assignedDate: new Date(),
          assignedBy: currentUserId,
        },
        include: {
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: id,
          action: "TRANSFERRED",
          description: data.notes || `Asset transferred from ${asset.assignedEmployee?.firstName} ${asset.assignedEmployee?.lastName} to ${targetEmployee.firstName} ${targetEmployee.lastName}`,
          fromEmployeeId: asset.assignedTo,
          toEmployeeId: data.toEmployeeId,
          performedBy: currentUserId,
        },
      });

      return updatedAsset;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Transfer asset error:", error);
    return res.status(500).json({ message: "Failed to transfer asset" });
  }
}

/**
 * Update asset status
 */
export async function updateAssetStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = UpdateAssetStatusDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: data.status,
          // Clear assignment if status is not ASSIGNED
          ...(data.status !== "ASSIGNED" && {
            assignedTo: null,
            assignedDate: null,
            assignedBy: null,
          }),
        },
        include: {
          assignedEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
      });

      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId: id,
          action: "STATUS_CHANGED",
          description: data.notes || `Status changed from ${asset.status} to ${data.status}`,
          previousStatus: asset.status,
          newStatus: data.status,
          performedBy: currentUserId,
        },
      });

      return updatedAsset;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update asset status error:", error);
    return res.status(500).json({ message: "Failed to update asset status" });
  }
}

/**
 * Delete asset
 */
export async function deleteAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check if asset is currently assigned
    if (asset.status === "ASSIGNED") {
      return res.status(400).json({ message: "Cannot delete assigned asset. Please revoke assignment first." });
    }

    await prisma.asset.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete asset error:", error);
    return res.status(500).json({ message: "Failed to delete asset" });
  }
}

/**
 * Get asset statistics
 */
export async function getAssetStats(req: Request, res: Response) {
  try {
    const query = AssetStatsQuery.parse(req.query);

    // Build where clause
    const where: Prisma.AssetWhereInput = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [
      totalAssets,
      statusCounts,
      conditionCounts,
      categoryBreakdown,
      locationBreakdown,
      totalValue,
      assignedCount,
      maintenanceCount,
      disposedCount,
    ] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      prisma.asset.groupBy({
        by: ["condition"],
        where,
        _count: { condition: true },
      }),
      prisma.asset.groupBy({
        by: ["categoryId"],
        where,
        _count: { categoryId: true },
      }),
      prisma.asset.groupBy({
        by: ["locationId"],
        where,
        _count: { locationId: true },
      }),
      prisma.asset.aggregate({
        where,
        _sum: { purchasePrice: true },
        _avg: { purchasePrice: true },
      }),
      prisma.asset.count({ where: { ...where, status: "ASSIGNED" } }),
      prisma.assetMaintenance.count({
        where: {
          asset: where,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
      }),
      prisma.asset.count({ where: { ...where, status: "DISPOSED" } }),
    ]);

    // Get category names for breakdown
    const categoryIds = categoryBreakdown.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Get location names for breakdown
    const locationIds = locationBreakdown.map((l) => l.locationId).filter(Boolean) as string[];
    const locations = await prisma.assetLocation.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true },
    });
    const locationMap = new Map(locations.map((l) => [l.id, l.name]));

    const stats = {
      totalAssets,
      totalValue: parseFloat(totalValue._sum.purchasePrice?.toString() || "0"),
      averageValue: parseFloat(totalValue._avg.purchasePrice?.toString() || "0"),
      assignedCount,
      maintenanceCount,
      disposedCount,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      conditionBreakdown: conditionCounts.reduce((acc, item) => {
        acc[item.condition.toLowerCase()] = item._count.condition;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
        const categoryName = categoryMap.get(item.categoryId) || "Unknown";
        acc[categoryName] = item._count.categoryId;
        return acc;
      }, {} as Record<string, number>),
      locationBreakdown: locationBreakdown.reduce((acc, item) => {
        const locationName = locationMap.get(item.locationId) || "Unknown";
        acc[locationName] = item._count.locationId;
        return acc;
      }, {} as Record<string, number>),
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error("Get asset stats error:", error);
    return res.status(500).json({ message: "Failed to get asset statistics" });
  }
}

/**
 * Get asset history
 */
export async function getAssetHistory(req: Request, res: Response) {
  try {
    const query = AssetHistoryQuery.parse(req.query);

    // Build where clause
    const where: Prisma.AssetHistoryWhereInput = {};

    if (query.assetId) {
      where.assetId = query.assetId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.performedBy) {
      where.performedBy = query.performedBy;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    const [history, total] = await Promise.all([
      prisma.assetHistory.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
            },
          },
          fromEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
          toEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
          performedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.assetHistory.count({ where }),
    ]);

    return res.status(200).json({
      items: history,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("Get asset history error:", error);
    return res.status(500).json({ message: "Failed to get asset history" });
  }
}

/**
 * Bulk update assets
 */
export async function bulkUpdateAssets(req: Request, res: Response) {
  try {
    const data = BulkUpdateAssetsDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);

    // Verify all assets exist
    const assets = await prisma.asset.findMany({
      where: { id: { in: data.assetIds } },
      select: { id: true, name: true, status: true },
    });

    if (assets.length !== data.assetIds.length) {
      return res.status(400).json({ message: "One or more assets not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAssets = await tx.asset.updateMany({
        where: { id: { in: data.assetIds } },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.condition && { condition: data.condition }),
          ...(data.location && { location: data.location }),
          ...(data.notes && { notes: data.notes }),
        },
      });

      // Create history entries for each asset
      const historyEntries = data.assetIds.map((assetId) => ({
        assetId,
        action: "STATUS_CHANGED" as const,
        description: `Bulk update: ${data.notes || "Multiple assets updated"}`,
        performedBy: currentUserId,
      }));

      await tx.assetHistory.createMany({
        data: historyEntries,
      });

      return updatedAssets;
    });

    return res.status(200).json({
      message: `${result.count} assets updated successfully`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error("Bulk update assets error:", error);
    return res.status(500).json({ message: "Failed to bulk update assets" });
  }
}
