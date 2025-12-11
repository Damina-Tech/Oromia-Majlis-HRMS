import { Request, Response } from "express";
<<<<<<< HEAD
import { v4 as uuidv4 } from "uuid";
import { In, Like } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { Asset, AssetStatus, AssetCondition, AssetCategory } from "../../entities/Asset.js";
import { AssetHistory, AssetHistoryAction } from "../../entities/AssetHistory.js";
import { Employee } from "../../entities/Employee.js";
=======
import {
  PrismaClient,
  Prisma,
  NotificationModule,
  NotificationType,
} from "@prisma/client";
>>>>>>> dev
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssignAssetDto,
<<<<<<< HEAD
  TransferAssetDto,
  UpdateAssetStatusDto,
  UpdateAssetConditionDto,
=======
  ReturnAssetDto,
>>>>>>> dev
  ListAssetsQuery,
  AssetStatsQuery,
  AssetHistoryQuery,
  BulkUpdateAssetsDto,
} from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";
<<<<<<< HEAD
=======
import { NotificationService } from "../notifications/notification.service.js";
import { generateAssetCode } from "./asset-utils.js";

const prisma = new PrismaClient();
>>>>>>> dev

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
    
<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const queryBuilder = assetRepo.createQueryBuilder("asset")
      .leftJoinAndSelect("asset.assignedEmployee", "assignedEmployee")
      .leftJoinAndSelect("assignedEmployee.department", "department")
      .leftJoinAndSelect("asset.assignedByUser", "assignedByUser");

    // Search functionality
    if (query.search) {
      queryBuilder.andWhere(
        "(asset.name ILIKE :search OR asset.serialNumber ILIKE :search OR asset.model ILIKE :search OR asset.brand ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    // Filter by category
    if (query.category) {
      queryBuilder.andWhere("asset.category = :category", { category: query.category });
=======
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
>>>>>>> dev
    }

    // Filter by status
    if (query.status) {
<<<<<<< HEAD
      queryBuilder.andWhere("asset.status = :status", { status: query.status });
=======
      where.status = query.status;
>>>>>>> dev
    }

    // Filter by condition
    if (query.condition) {
<<<<<<< HEAD
      queryBuilder.andWhere("asset.condition = :condition", { condition: query.condition });
    }

    // Filter by location
    if (query.location) {
      queryBuilder.andWhere("asset.location ILIKE :location", { location: `%${query.location}%` });
    }

    // Filter by assigned employee
    if (query.assignedTo) {
      queryBuilder.andWhere("asset.assignedTo = :assignedTo", { assignedTo: query.assignedTo });
    }

    // Filter by assigned by user
    if (query.assignedBy) {
      queryBuilder.andWhere("asset.assignedBy = :assignedBy", { assignedBy: query.assignedBy });
    }

    const { skip, take } = paginate(query.page, query.pageSize);
    
    // Order by
    const orderBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    queryBuilder.orderBy(`asset.${orderBy}`, sortOrder)
      .skip(skip)
      .take(take);

    const [assets, total] = await queryBuilder.getManyAndCount();

    // Add history count
    const assetsWithHistoryCount = await Promise.all(
      assets.map(async (asset) => {
        const historyCount = await AppDataSource.getRepository(AssetHistory).count({
          where: { assetId: asset.id },
        });
        return { ...asset, _count: { history: historyCount } };
      })
    );

    return res.status(200).json({
      items: assetsWithHistoryCount,
=======
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
>>>>>>> dev
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    });
  } catch (error: any) {
    console.error("List assets error:", error);
<<<<<<< HEAD
    return res.status(500).json({ message: "Failed to list assets" });
=======
    console.error("Error details:", error.message, error.stack);
    return res.status(500).json({ 
      message: "Failed to list assets",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
>>>>>>> dev
  }
}

/**
 * Get single asset by ID
 */
export async function getAsset(req: Request, res: Response) {
  try {
    const { id } = req.params;

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee", "assignedEmployee.department", "assignedByUser"],
=======
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
>>>>>>> dev
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

<<<<<<< HEAD
    // Get history
    const historyRepo = AppDataSource.getRepository(AssetHistory);
    const history = await historyRepo.find({
      where: { assetId: id },
      relations: ["fromEmployee", "toEmployee", "performedByUser"],
      order: { createdAt: "DESC" },
      take: 50,
    });

    return res.status(200).json({
      ...asset,
      history,
    });
=======
    return res.status(200).json(asset);
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const historyRepo = AppDataSource.getRepository(AssetHistory);

    // Check if serial number already exists
    const existingAsset = await assetRepo.findOne({
      where: { serialNumber: data.serialNumber },
    });

    if (existingAsset) {
      return res.status(409).json({ message: "Asset with this serial number already exists" });
    }

    // Create asset with history entry in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      const asset = new Asset();
      asset.id = uuidv4();
      asset.name = data.name;
      asset.serialNumber = data.serialNumber;
      asset.category = data.category as AssetCategory;
      asset.brand = data.brand;
      asset.model = data.model;
      asset.location = data.location;
      asset.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : undefined;
      asset.purchasePrice = data.purchasePrice ? data.purchasePrice.toFixed(2) : undefined;
      asset.currentValue = data.currentValue ? data.currentValue.toFixed(2) : undefined;
      asset.notes = data.notes;
      asset.status = AssetStatus.AVAILABLE;
      asset.condition = (data.condition || AssetCondition.EXCELLENT) as AssetCondition;

      const savedAsset = await manager.save(asset);

      // Create history entry
      const history = new AssetHistory();
      history.id = uuidv4();
      history.assetId = savedAsset.id;
      history.action = AssetHistoryAction.CREATED;
      history.description = `Asset ${savedAsset.name} created`;
      history.performedBy = currentUserId;
      await manager.save(history);

      return await manager.findOne(Asset, {
        where: { id: savedAsset.id },
        relations: ["assignedEmployee"],
      });
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create asset error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Asset with this serial number already exists" });
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const existingAsset = await assetRepo.findOne({ where: { id } });
=======
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });
>>>>>>> dev

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

<<<<<<< HEAD
    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      if (data.name) existingAsset.name = data.name;
      if (data.serialNumber) existingAsset.serialNumber = data.serialNumber;
      if (data.category) existingAsset.category = data.category as AssetCategory;
      if (data.brand) existingAsset.brand = data.brand;
      if (data.model) existingAsset.model = data.model;
      if (data.location) existingAsset.location = data.location;
      if (data.purchaseDate) existingAsset.purchaseDate = new Date(data.purchaseDate);
      if (data.purchasePrice !== undefined) existingAsset.purchasePrice = data.purchasePrice.toFixed(2);
      if (data.currentValue !== undefined) existingAsset.currentValue = data.currentValue.toFixed(2);
      if (data.notes !== undefined) existingAsset.notes = data.notes;
      if (data.status) existingAsset.status = data.status as AssetStatus;
      if (data.condition) existingAsset.condition = data.condition as AssetCondition;

      const updatedAsset = await manager.save(existingAsset);

      // Create history entry if there were changes
      if (changes.length > 0) {
        const history = new AssetHistory();
        history.id = uuidv4();
        history.assetId = id;
        history.action = AssetHistoryAction.STATUS_CHANGED;
        history.description = `Asset updated: ${changes.join(", ")}`;
        history.previousStatus = existingAsset.status;
        history.newStatus = (data.status || existingAsset.status) as AssetStatus;
        history.previousCondition = existingAsset.condition;
        history.newCondition = (data.condition || existingAsset.condition) as AssetCondition;
        history.performedBy = currentUserId;
        await manager.save(history);
      }

      return await manager.findOne(Asset, {
        where: { id },
        relations: ["assignedEmployee", "assignedByUser"],
      });
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update asset error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Asset with this serial number already exists" });
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const empRepo = AppDataSource.getRepository(Employee);
    const historyRepo = AppDataSource.getRepository(AssetHistory);

    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
=======
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
>>>>>>> dev
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

<<<<<<< HEAD
    if (asset.status !== AssetStatus.AVAILABLE) {
=======
    if (asset.status !== "IN_STOCK") {
>>>>>>> dev
      return res.status(400).json({ message: "Asset is not available for assignment" });
    }

    // Check if employee exists
<<<<<<< HEAD
    const employee = await empRepo.findOne({
      where: { id: data.employeeId },
      relations: ["department"],
    });
=======
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
    include: {
      department: true,
      user: {
        select: { id: true },
      },
    },
  });
>>>>>>> dev

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee already has this asset assigned
<<<<<<< HEAD
    if (asset.assignedTo === data.employeeId) {
      return res.status(400).json({ message: "Asset is already assigned to this employee" });
    }

    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      asset.status = AssetStatus.ASSIGNED;
      asset.assignedTo = data.employeeId;
      asset.assignedDate = new Date();
      asset.assignedBy = currentUserId;

      const updatedAsset = await manager.save(asset);

      // Create history entry
      const history = new AssetHistory();
      history.id = uuidv4();
      history.assetId = id;
      history.action = AssetHistoryAction.ASSIGNED;
      history.description = data.notes || `Asset assigned to ${employee.firstName} ${employee.lastName}`;
      history.toEmployeeId = data.employeeId;
      history.performedBy = currentUserId;
      await manager.save(history);

      return await manager.findOne(Asset, {
        where: { id },
        relations: ["assignedEmployee", "assignedEmployee.department", "assignedByUser"],
      });
=======
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
>>>>>>> dev
    });

    return res.status(200).json(result);
  } catch (error: any) {
<<<<<<< HEAD
    console.error("Assign asset error:", error);
    return res.status(500).json({ message: "Failed to assign asset" });
=======
    console.error("Return asset error:", error);
    return res.status(500).json({ message: "Failed to return asset" });
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
=======
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
>>>>>>> dev
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

<<<<<<< HEAD
    if (asset.status !== AssetStatus.ASSIGNED) {
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      asset.status = AssetStatus.AVAILABLE;
      asset.assignedTo = undefined;
      asset.assignedDate = undefined;
      asset.assignedBy = undefined;

      const updatedAsset = await manager.save(asset);

      // Create history entry
      const history = new AssetHistory();
      history.id = uuidv4();
      history.assetId = id;
      history.action = AssetHistoryAction.REVOKED;
      history.description = notes || `Asset assignment revoked from ${asset.assignedEmployee?.firstName} ${asset.assignedEmployee?.lastName}`;
      history.fromEmployeeId = asset.assignedTo;
      history.performedBy = currentUserId;
      await manager.save(history);

      return await manager.findOne(Asset, {
        where: { id },
        relations: ["assignedEmployee"],
      });
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const empRepo = AppDataSource.getRepository(Employee);

    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
=======
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignedEmployee: true },
>>>>>>> dev
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

<<<<<<< HEAD
    if (asset.status !== AssetStatus.ASSIGNED) {
=======
    if (asset.status !== "ASSIGNED") {
>>>>>>> dev
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    // Check if target employee exists
<<<<<<< HEAD
    const targetEmployee = await empRepo.findOne({ where: { id: data.toEmployeeId } });
=======
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: data.toEmployeeId },
    });
>>>>>>> dev

    if (!targetEmployee) {
      return res.status(404).json({ message: "Target employee not found" });
    }

<<<<<<< HEAD
    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      asset.assignedTo = data.toEmployeeId;
      asset.assignedDate = new Date();
      asset.assignedBy = currentUserId;

      const updatedAsset = await manager.save(asset);

      // Create history entry
      const history = new AssetHistory();
      history.id = uuidv4();
      history.assetId = id;
      history.action = AssetHistoryAction.TRANSFERRED;
      history.description = data.notes || `Asset transferred from ${asset.assignedEmployee?.firstName} ${asset.assignedEmployee?.lastName} to ${targetEmployee.firstName} ${targetEmployee.lastName}`;
      history.fromEmployeeId = asset.assignedTo;
      history.toEmployeeId = data.toEmployeeId;
      history.performedBy = currentUserId;
      await manager.save(history);

      return await manager.findOne(Asset, {
        where: { id },
        relations: ["assignedEmployee", "assignedEmployee.department", "assignedByUser"],
      });
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({ where: { id } });
=======
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
>>>>>>> dev

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

<<<<<<< HEAD
    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      const previousStatus = asset.status;
      asset.status = data.status as AssetStatus;
      
      // Clear assignment if status is not ASSIGNED
      if (data.status !== AssetStatus.ASSIGNED) {
        asset.assignedTo = undefined;
        asset.assignedDate = undefined;
        asset.assignedBy = undefined;
      }

      const updatedAsset = await manager.save(asset);

      // Create history entry
      const history = new AssetHistory();
      history.id = uuidv4();
      history.assetId = id;
      history.action = AssetHistoryAction.STATUS_CHANGED;
      history.description = data.notes || `Status changed from ${previousStatus} to ${data.status}`;
      history.previousStatus = previousStatus;
      history.newStatus = data.status as AssetStatus;
      history.performedBy = currentUserId;
      await manager.save(history);

      return await manager.findOne(Asset, {
        where: { id },
        relations: ["assignedEmployee"],
      });
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({ where: { id } });
=======
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
>>>>>>> dev

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check if asset is currently assigned
<<<<<<< HEAD
    if (asset.status === AssetStatus.ASSIGNED) {
      return res.status(400).json({ message: "Cannot delete assigned asset. Please revoke assignment first." });
    }

    await assetRepo.remove(asset);
=======
    if (asset.status === "ASSIGNED") {
      return res.status(400).json({ message: "Cannot delete assigned asset. Please revoke assignment first." });
    }

    await prisma.asset.delete({
      where: { id },
    });
>>>>>>> dev

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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);
    const queryBuilder = assetRepo.createQueryBuilder("asset");

    if (query.category) {
      queryBuilder.andWhere("asset.category = :category", { category: query.category });
    }

    if (query.location) {
      queryBuilder.andWhere("asset.location ILIKE :location", { location: `%${query.location}%` });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere("asset.createdAt >= :dateFrom", { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      queryBuilder.andWhere("asset.createdAt <= :dateTo", { dateTo: new Date(query.dateTo) });
    }

    const assets = await queryBuilder.getMany();

    // Calculate statistics manually
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue ? parseFloat(a.currentValue) : 0), 0);
    const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0;

    const statusBreakdown: Record<string, number> = {};
    const conditionBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    assets.forEach(asset => {
      statusBreakdown[asset.status.toLowerCase()] = (statusBreakdown[asset.status.toLowerCase()] || 0) + 1;
      conditionBreakdown[asset.condition.toLowerCase()] = (conditionBreakdown[asset.condition.toLowerCase()] || 0) + 1;
      categoryBreakdown[asset.category.toLowerCase()] = (categoryBreakdown[asset.category.toLowerCase()] || 0) + 1;
    });

    const stats = {
      totalAssets,
      totalValue,
      averageValue,
      statusBreakdown,
      conditionBreakdown,
      categoryBreakdown,
=======
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
>>>>>>> dev
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

<<<<<<< HEAD
    const historyRepo = AppDataSource.getRepository(AssetHistory);
    const queryBuilder = historyRepo.createQueryBuilder("history")
      .leftJoinAndSelect("history.asset", "asset")
      .leftJoinAndSelect("history.fromEmployee", "fromEmployee")
      .leftJoinAndSelect("history.toEmployee", "toEmployee")
      .leftJoinAndSelect("history.performedByUser", "performedByUser");

    if (query.assetId) {
      queryBuilder.andWhere("history.assetId = :assetId", { assetId: query.assetId });
    }

    if (query.action) {
      queryBuilder.andWhere("history.action = :action", { action: query.action });
    }

    if (query.performedBy) {
      queryBuilder.andWhere("history.performedBy = :performedBy", { performedBy: query.performedBy });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere("history.createdAt >= :dateFrom", { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      queryBuilder.andWhere("history.createdAt <= :dateTo", { dateTo: new Date(query.dateTo) });
    }

    const { skip, take } = paginate(query.page, query.pageSize);
    queryBuilder.orderBy("history.createdAt", "DESC")
      .skip(skip)
      .take(take);

    const [history, total] = await queryBuilder.getManyAndCount();
=======
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
>>>>>>> dev

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

<<<<<<< HEAD
    const assetRepo = AppDataSource.getRepository(Asset);

    // Verify all assets exist
    const assets = await assetRepo.find({
      where: { id: In(data.assetIds) },
=======
    // Verify all assets exist
    const assets = await prisma.asset.findMany({
      where: { id: { in: data.assetIds } },
      select: { id: true, name: true, status: true },
>>>>>>> dev
    });

    if (assets.length !== data.assetIds.length) {
      return res.status(400).json({ message: "One or more assets not found" });
    }

<<<<<<< HEAD
    // Update in transaction
    const result = await AppDataSource.transaction(async (manager) => {
      let updatedCount = 0;
      const historyRepo = manager.getRepository(AssetHistory);

      for (const asset of assets) {
        if (data.status) asset.status = data.status as AssetStatus;
        if (data.condition) asset.condition = data.condition as AssetCondition;
        if (data.location) asset.location = data.location;
        if (data.notes) asset.notes = data.notes;

        await manager.save(asset);

        // Create history entry
        const history = new AssetHistory();
        history.id = uuidv4();
        history.assetId = asset.id;
        history.action = AssetHistoryAction.STATUS_CHANGED;
        history.description = `Bulk update: ${data.notes || "Multiple assets updated"}`;
        history.performedBy = currentUserId;
        await manager.save(history);

        updatedCount++;
      }

      return { count: updatedCount };
=======
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
>>>>>>> dev
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
