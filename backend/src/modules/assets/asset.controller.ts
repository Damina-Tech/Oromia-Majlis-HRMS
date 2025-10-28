import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssignAssetDto,
  TransferAssetDto,
  UpdateAssetStatusDto,
  UpdateAssetConditionDto,
  ListAssetsQuery,
  AssetStatsQuery,
  AssetHistoryQuery,
  BulkUpdateAssetsDto,
} from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";

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
        { serialNumber: { contains: query.search, mode: "insensitive" } },
        { model: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Filter by category
    if (query.category) {
      where.category = query.category;
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
    if (query.location) {
      where.location = { contains: query.location, mode: "insensitive" };
    }

    // Filter by assigned employee
    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }

    // Filter by assigned by user
    if (query.assignedBy) {
      where.assignedBy = query.assignedBy;
    }

    const { skip, take } = paginate(query.page, query.pageSize);

    // Build orderBy clause
    const orderBy: Prisma.AssetOrderByWithRelationInput = {};
    orderBy[query.sortBy] = query.sortOrder;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
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
          _count: {
            select: {
              history: true,
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
    return res.status(500).json({ message: "Failed to list assets" });
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
        assignedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
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

    // Check if serial number already exists
    const existingAsset = await prisma.asset.findUnique({
      where: { serialNumber: data.serialNumber },
    });

    if (existingAsset) {
      return res.status(409).json({ message: "Asset with this serial number already exists" });
    }

    // Create asset with history entry
    const asset = await prisma.$transaction(async (tx) => {
      const newAsset = await tx.asset.create({
        data: {
          ...data,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : null,
          currentValue: data.currentValue ? new Prisma.Decimal(data.currentValue) : null,
          status: "AVAILABLE",
          condition: data.condition || "EXCELLENT",
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
          assetId: newAsset.id,
          action: "CREATED",
          description: `Asset ${newAsset.name} created`,
          performedBy: currentUserId,
        },
      });

      return newAsset;
    });

    return res.status(201).json(asset);
  } catch (error: any) {
    console.error("Create asset error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Asset with this serial number already exists" });
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

    const asset = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          ...data,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : undefined,
          currentValue: data.currentValue ? new Prisma.Decimal(data.currentValue) : undefined,
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
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Asset is not available for assignment" });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { department: true },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee already has this asset assigned
    if (asset.assignedTo === data.employeeId) {
      return res.status(400).json({ message: "Asset is already assigned to this employee" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: "ASSIGNED",
          assignedTo: data.employeeId,
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
          action: "ASSIGNED",
          description: data.notes || `Asset assigned to ${employee.firstName} ${employee.lastName}`,
          toEmployeeId: data.employeeId,
          performedBy: currentUserId,
        },
      });

      return updatedAsset;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Assign asset error:", error);
    return res.status(500).json({ message: "Failed to assign asset" });
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

    if (query.category) {
      where.category = query.category;
    }

    if (query.location) {
      where.location = { contains: query.location, mode: "insensitive" };
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
      categoryCounts,
      totalValue,
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
        by: ["category"],
        where,
        _count: { category: true },
      }),
      prisma.asset.aggregate({
        where,
        _sum: { currentValue: true },
        _avg: { currentValue: true },
      }),
    ]);

    const stats = {
      totalAssets,
      totalValue: parseFloat(totalValue._sum.currentValue?.toString() || "0"),
      averageValue: parseFloat(totalValue._avg.currentValue?.toString() || "0"),
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      conditionBreakdown: conditionCounts.reduce((acc, item) => {
        acc[item.condition.toLowerCase()] = item._count.condition;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: categoryCounts.reduce((acc, item) => {
        acc[item.category.toLowerCase()] = item._count.category;
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
