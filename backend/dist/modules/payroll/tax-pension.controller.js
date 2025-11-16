import { PrismaClient, Prisma } from "@prisma/client";
import { CreateTaxRateDto, UpdateTaxRateDto, CreatePensionRateDto, UpdatePensionRateDto, ListTaxRateQuery, ListPensionRateQuery, } from "./tax-pension.dto.js";
const prisma = new PrismaClient();
// ========== Tax Rate CRUD ==========
export async function createTaxRate(req, res) {
    try {
        const dto = CreateTaxRateDto.parse(req.body);
        const taxRate = await prisma.taxRate.create({
            data: {
                minIncome: new Prisma.Decimal(dto.minIncome),
                maxIncome: dto.maxIncome ? new Prisma.Decimal(dto.maxIncome) : null,
                rate: new Prisma.Decimal(dto.rate),
                fixedAmount: dto.fixedAmount ? new Prisma.Decimal(dto.fixedAmount) : null,
                year: dto.year,
                description: dto.description,
                isActive: dto.isActive,
            },
        });
        return res.status(201).json(taxRate);
    }
    catch (error) {
        console.error("Create tax rate error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to create tax rate" });
    }
}
export async function listTaxRates(req, res) {
    try {
        const query = ListTaxRateQuery.parse(req.query);
        const where = {};
        if (query.year)
            where.year = query.year;
        if (query.isActive !== undefined)
            where.isActive = query.isActive;
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            prisma.taxRate.findMany({
                where,
                skip,
                take: query.pageSize,
                orderBy: [{ year: "desc" }, { minIncome: "asc" }],
            }),
            prisma.taxRate.count({ where }),
        ]);
        return res.status(200).json({
            items,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        });
    }
    catch (error) {
        console.error("List tax rates error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to list tax rates" });
    }
}
export async function getTaxRate(req, res) {
    try {
        const { id } = req.params;
        const taxRate = await prisma.taxRate.findUnique({
            where: { id },
        });
        if (!taxRate) {
            return res.status(404).json({ message: "Tax rate not found" });
        }
        return res.status(200).json(taxRate);
    }
    catch (error) {
        console.error("Get tax rate error:", error);
        return res.status(500).json({ message: "Failed to get tax rate" });
    }
}
export async function updateTaxRate(req, res) {
    try {
        const { id } = req.params;
        const dto = UpdateTaxRateDto.parse(req.body);
        const updateData = {};
        if (dto.minIncome !== undefined)
            updateData.minIncome = new Prisma.Decimal(dto.minIncome);
        if (dto.maxIncome !== undefined)
            updateData.maxIncome = dto.maxIncome ? new Prisma.Decimal(dto.maxIncome) : null;
        if (dto.rate !== undefined)
            updateData.rate = new Prisma.Decimal(dto.rate);
        if (dto.fixedAmount !== undefined)
            updateData.fixedAmount = dto.fixedAmount ? new Prisma.Decimal(dto.fixedAmount) : null;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        const taxRate = await prisma.taxRate.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json(taxRate);
    }
    catch (error) {
        console.error("Update tax rate error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to update tax rate" });
    }
}
export async function deleteTaxRate(req, res) {
    try {
        const { id } = req.params;
        await prisma.taxRate.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete tax rate error:", error);
        return res.status(500).json({ message: "Failed to delete tax rate" });
    }
}
// ========== Pension Rate CRUD ==========
export async function createPensionRate(req, res) {
    try {
        const dto = CreatePensionRateDto.parse(req.body);
        // Check if rate already exists for this year
        const existing = await prisma.pensionRate.findFirst({
            where: {
                year: dto.year,
                isActive: true,
            },
        });
        if (existing && dto.isActive) {
            return res.status(400).json({
                message: `Active pension rate already exists for year ${dto.year}. Please deactivate the existing rate first.`,
            });
        }
        const pensionRate = await prisma.pensionRate.create({
            data: {
                employeeRate: new Prisma.Decimal(dto.employeeRate),
                employerRate: new Prisma.Decimal(dto.employerRate),
                year: dto.year,
                description: dto.description,
                isActive: dto.isActive,
            },
        });
        return res.status(201).json(pensionRate);
    }
    catch (error) {
        console.error("Create pension rate error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to create pension rate" });
    }
}
export async function listPensionRates(req, res) {
    try {
        const query = ListPensionRateQuery.parse(req.query);
        const where = {};
        if (query.year)
            where.year = query.year;
        if (query.isActive !== undefined)
            where.isActive = query.isActive;
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            prisma.pensionRate.findMany({
                where,
                skip,
                take: query.pageSize,
                orderBy: { year: "desc" },
            }),
            prisma.pensionRate.count({ where }),
        ]);
        return res.status(200).json({
            items,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        });
    }
    catch (error) {
        console.error("List pension rates error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to list pension rates" });
    }
}
export async function getPensionRate(req, res) {
    try {
        const { id } = req.params;
        const pensionRate = await prisma.pensionRate.findUnique({
            where: { id },
        });
        if (!pensionRate) {
            return res.status(404).json({ message: "Pension rate not found" });
        }
        return res.status(200).json(pensionRate);
    }
    catch (error) {
        console.error("Get pension rate error:", error);
        return res.status(500).json({ message: "Failed to get pension rate" });
    }
}
export async function updatePensionRate(req, res) {
    try {
        const { id } = req.params;
        const dto = UpdatePensionRateDto.parse(req.body);
        const updateData = {};
        if (dto.employeeRate !== undefined)
            updateData.employeeRate = new Prisma.Decimal(dto.employeeRate);
        if (dto.employerRate !== undefined)
            updateData.employerRate = new Prisma.Decimal(dto.employerRate);
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        const pensionRate = await prisma.pensionRate.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json(pensionRate);
    }
    catch (error) {
        console.error("Update pension rate error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to update pension rate" });
    }
}
export async function deletePensionRate(req, res) {
    try {
        const { id } = req.params;
        await prisma.pensionRate.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Delete pension rate error:", error);
        return res.status(500).json({ message: "Failed to delete pension rate" });
    }
}
//# sourceMappingURL=tax-pension.controller.js.map