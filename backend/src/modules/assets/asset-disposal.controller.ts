import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";
import { CreateAssetDisposalDto } from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";

function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

export async function listAssetDisposals(req: Request, res: Response) {
  try {
    const { assetId, page = 1, pageSize = 50 } = req.query;
    const { skip, take } = paginate(Number(page), Number(pageSize));
    
    const where: Prisma.AssetDisposalWhereInput = {};
    if (assetId) {
      where.assetId = assetId as string;
    }
    
    const [disposals, total] = await Promise.all([
      prisma.assetDisposal.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetCode: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { disposalDate: "desc" },
        skip,
        take,
      }),
      prisma.assetDisposal.count({ where }),
    ]);
    
    return res.status(200).json({
      items: disposals,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (error: any) {
    console.error("List asset disposals error:", error);
    return res.status(500).json({ message: "Failed to list asset disposals" });
  }
}

export async function getAssetDisposal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const disposal = await prisma.assetDisposal.findUnique({
      where: { id },
      include: {
        asset: true,
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!disposal) {
      return res.status(404).json({ message: "Disposal record not found" });
    }
    return res.status(200).json(disposal);
  } catch (error: any) {
    console.error("Get asset disposal error:", error);
    return res.status(500).json({ message: "Failed to get asset disposal" });
  }
}

export async function createAssetDisposal(req: Request, res: Response) {
  try {
    const { assetId } = req.params;
    const data = CreateAssetDisposalDto.parse(req.body);
    const currentUserId = getCurrentUserId(req);
    
    // Verify asset exists and is not already disposed
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (asset.status === "DISPOSED") {
      return res.status(400).json({ message: "Asset is already disposed" });
    }
    
    const disposal = await prisma.$transaction(async (tx) => {
      // Create disposal record
      const newDisposal = await tx.assetDisposal.create({
        data: {
          assetId,
          disposalDate: new Date(data.disposalDate),
          method: data.method,
          saleAmount: data.saleAmount ? new Prisma.Decimal(data.saleAmount) : null,
          notes: data.notes,
          approvedBy: currentUserId,
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetCode: true,
            },
          },
        },
      });
      
      // Update asset status to DISPOSED
      await tx.asset.update({
        where: { id: assetId },
        data: {
          status: "DISPOSED",
          assignedToEmployeeId: null, // Clear assignment
        },
      });
      
      // Create history entry
      await tx.assetHistory.create({
        data: {
          assetId,
          action: "DISPOSED",
          description: `Asset disposed via ${data.method}`,
          performedBy: currentUserId,
        },
      });
      
      // Create audit log
      await tx.assetAuditLog.create({
        data: {
          assetId,
          changedBy: currentUserId,
          changeSummary: `Asset disposed: ${data.method} - ${data.notes || ""}`,
        },
      });
      
      return newDisposal;
    });
    
    return res.status(201).json(disposal);
  } catch (error: any) {
    console.error("Create asset disposal error:", error);
    return res.status(500).json({ message: "Failed to create asset disposal" });
  }
}

