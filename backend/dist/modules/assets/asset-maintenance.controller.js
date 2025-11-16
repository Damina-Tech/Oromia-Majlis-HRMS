import { PrismaClient, Prisma } from "@prisma/client";
import { CreateAssetMaintenanceDto, UpdateAssetMaintenanceDto } from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";
const prisma = new PrismaClient();
function getCurrentUserId(req) {
    return req.user?.id;
}
export async function listAssetMaintenance(req, res) {
    try {
        const { assetId, page = 1, pageSize = 50 } = req.query;
        const { skip, take } = paginate(Number(page), Number(pageSize));
        const where = {};
        if (assetId) {
            where.assetId = assetId;
        }
        const [maintenance, total] = await Promise.all([
            prisma.assetMaintenance.findMany({
                where,
                include: {
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            assetCode: true,
                        },
                    },
                    vendor: true,
                    performedByEmployee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            employeeCode: true,
                        },
                    },
                },
                orderBy: { date: "desc" },
                skip,
                take,
            }),
            prisma.assetMaintenance.count({ where }),
        ]);
        return res.status(200).json({
            items: maintenance,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(total / Number(pageSize)),
        });
    }
    catch (error) {
        console.error("List asset maintenance error:", error);
        return res.status(500).json({ message: "Failed to list asset maintenance" });
    }
}
export async function getAssetMaintenance(req, res) {
    try {
        const { id } = req.params;
        const maintenance = await prisma.assetMaintenance.findUnique({
            where: { id },
            include: {
                asset: true,
                vendor: true,
                performedByEmployee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance record not found" });
        }
        return res.status(200).json(maintenance);
    }
    catch (error) {
        console.error("Get asset maintenance error:", error);
        return res.status(500).json({ message: "Failed to get asset maintenance" });
    }
}
export async function createAssetMaintenance(req, res) {
    try {
        const { assetId } = req.params;
        const data = CreateAssetMaintenanceDto.parse(req.body);
        const currentUserId = getCurrentUserId(req);
        // Verify asset exists
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        const maintenance = await prisma.$transaction(async (tx) => {
            const newMaintenance = await tx.assetMaintenance.create({
                data: {
                    assetId,
                    date: new Date(data.date),
                    type: data.type,
                    vendorId: data.vendorId || undefined,
                    cost: data.cost ? new Prisma.Decimal(data.cost) : null,
                    performedBy: data.performedBy || undefined,
                    nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
                    status: data.status,
                    notes: data.notes,
                },
                include: {
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            assetCode: true,
                        },
                    },
                    vendor: true,
                },
            });
            // Update asset status if maintenance is starting
            if (data.status === "IN_PROGRESS") {
                await tx.asset.update({
                    where: { id: assetId },
                    data: { status: "IN_MAINTENANCE" },
                });
                // Create history entry
                await tx.assetHistory.create({
                    data: {
                        assetId,
                        action: "MAINTENANCE_STARTED",
                        description: `Maintenance started: ${data.type}`,
                        performedBy: currentUserId,
                    },
                });
            }
            return newMaintenance;
        });
        return res.status(201).json(maintenance);
    }
    catch (error) {
        console.error("Create asset maintenance error:", error);
        return res.status(500).json({ message: "Failed to create asset maintenance" });
    }
}
export async function updateAssetMaintenance(req, res) {
    try {
        const { id } = req.params;
        const data = UpdateAssetMaintenanceDto.parse(req.body);
        const currentUserId = getCurrentUserId(req);
        const existingMaintenance = await prisma.assetMaintenance.findUnique({
            where: { id },
            include: { asset: true },
        });
        if (!existingMaintenance) {
            return res.status(404).json({ message: "Maintenance record not found" });
        }
        const maintenance = await prisma.$transaction(async (tx) => {
            const updated = await tx.assetMaintenance.update({
                where: { id },
                data: {
                    date: data.date ? new Date(data.date) : undefined,
                    type: data.type,
                    vendorId: data.vendorId || undefined,
                    cost: data.cost !== undefined ? (data.cost ? new Prisma.Decimal(data.cost) : null) : undefined,
                    performedBy: data.performedBy || undefined,
                    nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
                    status: data.status,
                    notes: data.notes,
                },
                include: {
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            assetCode: true,
                        },
                    },
                    vendor: true,
                },
            });
            // Update asset status based on maintenance status
            if (data.status === "COMPLETED" && existingMaintenance.status !== "COMPLETED") {
                // Check if there are other in-progress maintenance records
                const inProgressCount = await tx.assetMaintenance.count({
                    where: {
                        assetId: existingMaintenance.assetId,
                        status: "IN_PROGRESS",
                        id: { not: id },
                    },
                });
                if (inProgressCount === 0) {
                    // No other in-progress maintenance, restore asset to previous status
                    const asset = await tx.asset.findUnique({
                        where: { id: existingMaintenance.assetId },
                    });
                    if (asset) {
                        await tx.asset.update({
                            where: { id: existingMaintenance.assetId },
                            data: {
                                status: asset.assignedToEmployeeId ? "ASSIGNED" : "IN_STOCK",
                            },
                        });
                    }
                    // Create history entry
                    await tx.assetHistory.create({
                        data: {
                            assetId: existingMaintenance.assetId,
                            action: "MAINTENANCE_COMPLETED",
                            description: `Maintenance completed`,
                            performedBy: currentUserId,
                        },
                    });
                }
            }
            return updated;
        });
        return res.status(200).json(maintenance);
    }
    catch (error) {
        console.error("Update asset maintenance error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Maintenance record not found" });
        }
        return res.status(500).json({ message: "Failed to update asset maintenance" });
    }
}
export async function deleteAssetMaintenance(req, res) {
    try {
        const { id } = req.params;
        await prisma.assetMaintenance.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete asset maintenance error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Maintenance record not found" });
        }
        return res.status(500).json({ message: "Failed to delete asset maintenance" });
    }
}
//# sourceMappingURL=asset-maintenance.controller.js.map