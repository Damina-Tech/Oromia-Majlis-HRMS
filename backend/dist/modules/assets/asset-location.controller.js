import { PrismaClient } from "@prisma/client";
import { CreateAssetLocationDto, UpdateAssetLocationDto } from "./asset.dto.js";
const prisma = new PrismaClient();
export async function listAssetLocations(req, res) {
    try {
        const locations = await prisma.assetLocation.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { assets: true },
                },
            },
        });
        return res.status(200).json(locations);
    }
    catch (error) {
        console.error("List asset locations error:", error);
        return res.status(500).json({ message: "Failed to list asset locations" });
    }
}
export async function getAssetLocation(req, res) {
    try {
        const { id } = req.params;
        const location = await prisma.assetLocation.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { assets: true },
                },
            },
        });
        if (!location) {
            return res.status(404).json({ message: "Asset location not found" });
        }
        return res.status(200).json(location);
    }
    catch (error) {
        console.error("Get asset location error:", error);
        return res.status(500).json({ message: "Failed to get asset location" });
    }
}
export async function createAssetLocation(req, res) {
    try {
        const data = CreateAssetLocationDto.parse(req.body);
        const location = await prisma.assetLocation.create({ data });
        return res.status(201).json(location);
    }
    catch (error) {
        console.error("Create asset location error:", error);
        return res.status(500).json({ message: "Failed to create asset location" });
    }
}
export async function updateAssetLocation(req, res) {
    try {
        const { id } = req.params;
        const data = UpdateAssetLocationDto.parse(req.body);
        const location = await prisma.assetLocation.update({
            where: { id },
            data,
        });
        return res.status(200).json(location);
    }
    catch (error) {
        console.error("Update asset location error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset location not found" });
        }
        return res.status(500).json({ message: "Failed to update asset location" });
    }
}
export async function deleteAssetLocation(req, res) {
    try {
        const { id } = req.params;
        // Check if location is used by any assets
        const assetsCount = await prisma.asset.count({
            where: { locationId: id },
        });
        if (assetsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete location. ${assetsCount} asset(s) are using this location.`,
            });
        }
        await prisma.assetLocation.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete asset location error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset location not found" });
        }
        return res.status(500).json({ message: "Failed to delete asset location" });
    }
}
//# sourceMappingURL=asset-location.controller.js.map