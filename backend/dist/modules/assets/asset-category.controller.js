import { PrismaClient } from "@prisma/client";
import { CreateAssetCategoryDto, UpdateAssetCategoryDto } from "./asset.dto.js";
const prisma = new PrismaClient();
export async function listAssetCategories(req, res) {
    try {
        const categories = await prisma.assetCategory.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { assets: true },
                },
            },
        });
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error("List asset categories error:", error);
        return res.status(500).json({ message: "Failed to list asset categories" });
    }
}
export async function getAssetCategory(req, res) {
    try {
        const { id } = req.params;
        const category = await prisma.assetCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { assets: true },
                },
            },
        });
        if (!category) {
            return res.status(404).json({ message: "Asset category not found" });
        }
        return res.status(200).json(category);
    }
    catch (error) {
        console.error("Get asset category error:", error);
        return res.status(500).json({ message: "Failed to get asset category" });
    }
}
export async function createAssetCategory(req, res) {
    try {
        const data = CreateAssetCategoryDto.parse(req.body);
        const category = await prisma.assetCategory.create({ data });
        return res.status(201).json(category);
    }
    catch (error) {
        console.error("Create asset category error:", error);
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Asset category with this name already exists" });
        }
        return res.status(500).json({ message: "Failed to create asset category" });
    }
}
export async function updateAssetCategory(req, res) {
    try {
        const { id } = req.params;
        const data = UpdateAssetCategoryDto.parse(req.body);
        const category = await prisma.assetCategory.update({
            where: { id },
            data,
        });
        return res.status(200).json(category);
    }
    catch (error) {
        console.error("Update asset category error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset category not found" });
        }
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Asset category with this name already exists" });
        }
        return res.status(500).json({ message: "Failed to update asset category" });
    }
}
export async function deleteAssetCategory(req, res) {
    try {
        const { id } = req.params;
        // Check if category is used by any assets
        const assetsCount = await prisma.asset.count({
            where: { categoryId: id },
        });
        if (assetsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete category. ${assetsCount} asset(s) are using this category.`,
            });
        }
        await prisma.assetCategory.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete asset category error:", error);
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Asset category not found" });
        }
        return res.status(500).json({ message: "Failed to delete asset category" });
    }
}
//# sourceMappingURL=asset-category.controller.js.map