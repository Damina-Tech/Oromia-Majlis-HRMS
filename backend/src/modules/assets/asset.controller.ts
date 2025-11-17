import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { In, Like } from "typeorm";
import { AppDataSource } from "../../db/data-source.js";
import { Asset, AssetStatus, AssetCondition, AssetCategory } from "../../entities/Asset.js";
import { AssetHistory, AssetHistoryAction } from "../../entities/AssetHistory.js";
import { Employee } from "../../entities/Employee.js";
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
    }

    // Filter by status
    if (query.status) {
      queryBuilder.andWhere("asset.status = :status", { status: query.status });
    }

    // Filter by condition
    if (query.condition) {
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

    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee", "assignedEmployee.department", "assignedByUser"],
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

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

    const assetRepo = AppDataSource.getRepository(Asset);
    const existingAsset = await assetRepo.findOne({ where: { id } });

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

    const assetRepo = AppDataSource.getRepository(Asset);
    const empRepo = AppDataSource.getRepository(Employee);
    const historyRepo = AppDataSource.getRepository(AssetHistory);

    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      return res.status(400).json({ message: "Asset is not available for assignment" });
    }

    // Check if employee exists
    const employee = await empRepo.findOne({
      where: { id: data.employeeId },
      relations: ["department"],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee already has this asset assigned
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

    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

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

    const assetRepo = AppDataSource.getRepository(Asset);
    const empRepo = AppDataSource.getRepository(Employee);

    const asset = await assetRepo.findOne({
      where: { id },
      relations: ["assignedEmployee"],
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== AssetStatus.ASSIGNED) {
      return res.status(400).json({ message: "Asset is not currently assigned" });
    }

    // Check if target employee exists
    const targetEmployee = await empRepo.findOne({ where: { id: data.toEmployeeId } });

    if (!targetEmployee) {
      return res.status(404).json({ message: "Target employee not found" });
    }

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

    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({ where: { id } });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

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

    const assetRepo = AppDataSource.getRepository(Asset);
    const asset = await assetRepo.findOne({ where: { id } });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check if asset is currently assigned
    if (asset.status === AssetStatus.ASSIGNED) {
      return res.status(400).json({ message: "Cannot delete assigned asset. Please revoke assignment first." });
    }

    await assetRepo.remove(asset);

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

    const assetRepo = AppDataSource.getRepository(Asset);

    // Verify all assets exist
    const assets = await assetRepo.find({
      where: { id: In(data.assetIds) },
    });

    if (assets.length !== data.assetIds.length) {
      return res.status(400).json({ message: "One or more assets not found" });
    }

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
