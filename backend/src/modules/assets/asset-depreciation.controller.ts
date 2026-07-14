import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";
import { RunDepreciationDto } from "./asset.dto.js";
import { calculateDepreciation } from "./asset-utils.js";
import { paginate } from "../../utils/pagination.js";

export async function listAssetDepreciation(req: Request, res: Response) {
  try {
    const { assetId, year, page = 1, pageSize = 50 } = req.query;
    const { skip, take } = paginate(Number(page), Number(pageSize));
    
    const where: Prisma.AssetDepreciationWhereInput = {};
    if (assetId) {
      where.assetId = assetId as string;
    }
    if (year) {
      where.year = Number(year);
    }
    
    const [depreciation, total] = await Promise.all([
      prisma.assetDepreciation.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetCode: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip,
        take,
      }),
      prisma.assetDepreciation.count({ where }),
    ]);
    
    return res.status(200).json({
      items: depreciation,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (error: any) {
    console.error("List asset depreciation error:", error);
    return res.status(500).json({ message: "Failed to list asset depreciation" });
  }
}

export async function getAssetDepreciation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const depreciation = await prisma.assetDepreciation.findUnique({
      where: { id },
      include: {
        asset: true,
      },
    });
    if (!depreciation) {
      return res.status(404).json({ message: "Depreciation record not found" });
    }
    return res.status(200).json(depreciation);
  } catch (error: any) {
    console.error("Get asset depreciation error:", error);
    return res.status(500).json({ message: "Failed to get asset depreciation" });
  }
}

export async function runDepreciation(req: Request, res: Response) {
  try {
    const { year, month } = req.query;
    const dto = RunDepreciationDto.parse({ year, month });
    
    // Get all assets with depreciation settings
    const assets = await prisma.asset.findMany({
      where: {
        purchaseDate: { not: null },
        purchasePrice: { not: null },
        depreciationMethod: { not: null },
        depreciationRate: { not: null },
        lifeYears: { not: null },
        status: { not: "DISPOSED" },
      },
      include: {
        depreciation: {
          where: {
            year: dto.year,
            ...(dto.month ? { month: dto.month } : { month: null }),
          },
        },
      },
    });
    
    const results = [];
    const errors = [];
    
    for (const asset of assets) {
      try {
        // Check if depreciation already exists for this period
        if (asset.depreciation.length > 0) {
          errors.push({
            assetId: asset.id,
            assetCode: asset.assetCode,
            error: "Depreciation already calculated for this period",
          });
          continue;
        }
        
        if (!asset.purchaseDate || !asset.purchasePrice || !asset.depreciationMethod || !asset.depreciationRate || !asset.lifeYears) {
          errors.push({
            assetId: asset.id,
            assetCode: asset.assetCode,
            error: "Missing depreciation configuration",
          });
          continue;
        }
        
        // Calculate years elapsed
        const purchaseDate = new Date(asset.purchaseDate);
        const currentDate = month
          ? new Date(dto.year, dto.month! - 1, 1)
          : new Date(dto.year, 0, 1);
        const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (yearsElapsed < 0) {
          errors.push({
            assetId: asset.id,
            assetCode: asset.assetCode,
            error: "Purchase date is in the future",
          });
          continue;
        }
        
        // Get previous depreciation to calculate accumulated
        const previousDepreciation = await prisma.assetDepreciation.findFirst({
          where: {
            assetId: asset.id,
            year: { lt: dto.year },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });
        
        const purchasePrice = parseFloat(asset.purchasePrice.toString());
        const depreciation = calculateDepreciation(
          purchasePrice,
          asset.depreciationMethod as "STRAIGHT_LINE" | "DECLINING_BALANCE",
          parseFloat(asset.depreciationRate.toString()),
          parseFloat(asset.lifeYears.toString()),
          yearsElapsed
        );
        
        // Calculate accumulated depreciation
        const previousAccumulated = previousDepreciation
          ? parseFloat(previousDepreciation.accumulatedDepr.toString())
          : 0;
        const accumulatedDepr = previousAccumulated + depreciation.depreciationAmount;
        const bookValue = purchasePrice - accumulatedDepr;
        
        // Create depreciation record
        const depreciationRecord = await prisma.assetDepreciation.create({
          data: {
            assetId: asset.id,
            year: dto.year,
            month: dto.month || null,
            depreciationAmount: new Prisma.Decimal(depreciation.depreciationAmount),
            accumulatedDepr: new Prisma.Decimal(accumulatedDepr),
            bookValue: new Prisma.Decimal(Math.max(0, bookValue)),
          },
        });
        
        results.push({
          assetId: asset.id,
          assetCode: asset.assetCode,
          depreciationRecord,
        });
      } catch (error: any) {
        errors.push({
          assetId: asset.id,
          assetCode: asset.assetCode,
          error: error.message,
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error("Run depreciation error:", error);
    return res.status(500).json({ message: "Failed to run depreciation calculation" });
  }
}

