import { PrismaClient } from "@prisma/client";
import { CreateAssetVendorDto, UpdateAssetVendorDto } from "./asset.dto.js";
import { paginate } from "../../utils/pagination.js";
const prisma = new PrismaClient();
export async function listAssetVendors(req, res) {
    try {
        const { page = 1, pageSize = 50, search } = req.query;
        const { skip, take } = paginate(Number(page), Number(pageSize));
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { contact: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        const [vendors, total] = await Promise.all([
            prisma.assetVendor.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take,
                include: {
                    _count: {
                        select: { assets: true, maintenance: true },
                    },
                },
            }),
            prisma.assetVendor.count({ where }),
        ]);
        return res.status(200).json({
            items: vendors,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(total / Number(pageSize)),
        });
    }
    catch (error) {
        console.error("List asset vendors error:", error);
        return res.status(500).json({ message: "Failed to list asset vendors" });
    }
}
export async function getAssetVendor(req, res) {
    try {
        const { id } = req.params;
        const vendor = await prisma.assetVendor.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { assets: true, maintenance: true },
                },
            },
        });
        if (!vendor) {
            return res.status(404).json({ message: "Asset vendor not found" });
        }
        return res.status(200).json(vendor);
    }
    catch (error) {
        console.error("Get asset vendor error:", error);
        return res.status(500).json({ message: "Failed to get asset vendor" });
    }
}
export async function createAssetVendor(req, res) {
    try {
        const data = CreateAssetVendorDto.parse(req.body);
        const vendor = await prisma.assetVendor.create({ data });
        return res.status(201).json(vendor);
    }
    catch (error) {
        console.error("Create asset vendor error:", error);
        return res.status(500).json({ message: "Failed to create asset vendor" });
    }
}
export async function updateAssetVendor(req, res) {
    try {
        const { id } = req.params;
        const data = UpdateAssetVendorDto.parse(req.body);
        const vendor = await prisma.assetVendor.update({
            where: { id },
            data,
        });
        return res.status(200).json(vendor);
    }
    catch (error) {
        console.error("Update asset vendor error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset vendor not found" });
        }
        return res.status(500).json({ message: "Failed to update asset vendor" });
    }
}
export async function deleteAssetVendor(req, res) {
    try {
        const { id } = req.params;
        // Check if vendor is used by any assets or maintenance records
        const [assetsCount, maintenanceCount] = await Promise.all([
            prisma.asset.count({ where: { vendorId: id } }),
            prisma.assetMaintenance.count({ where: { vendorId: id } }),
        ]);
        if (assetsCount > 0 || maintenanceCount > 0) {
            return res.status(400).json({
                message: `Cannot delete vendor. ${assetsCount} asset(s) and ${maintenanceCount} maintenance record(s) are using this vendor.`,
            });
        }
        await prisma.assetVendor.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete asset vendor error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset vendor not found" });
        }
        return res.status(500).json({ message: "Failed to delete asset vendor" });
    }
}
//# sourceMappingURL=asset-vendor.controller.js.map