import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  BatchGenerateIdCardDto,
  CreateIdCardTemplateDto,
  GenerateIdCardDto,
  IdCardTemplateSettings,
  IdCardTemplateSettingsSchema,
  UpdateIdCardTemplateDto,
} from "./employee.dto.js";
import { JwtUser } from "../../middleware/auth.js";
import { generateIdCardAssets } from "./id-card.renderer.js";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "../../../uploads");
const idCardsDir = path.join(uploadsRoot, "id-cards");

if (!fs.existsSync(idCardsDir)) {
  fs.mkdirSync(idCardsDir, { recursive: true });
}

const canManageAll = (user?: JwtUser) =>
  Boolean(user?.permissions?.includes("employees.id.manage") || user?.permissions?.includes("employees.write"));

const hasGeneratePermission = (user?: JwtUser) => Boolean(user?.permissions?.includes("employees.id.generate"));

function parseSettings(raw: Prisma.JsonValue | null): IdCardTemplateSettings {
  return IdCardTemplateSettingsSchema.parse(raw ?? {});
}

async function resolveTemplate(templateId?: string | null) {
  if (templateId) {
    return prisma.employeeIdTemplate.findUnique({ where: { id: templateId } });
  }
  return prisma.employeeIdTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function ensureRequesterEmployee(user?: JwtUser) {
  if (!user?.employeeId) return null;
  return prisma.employee.findUnique({
    where: { id: user.employeeId },
    select: { id: true, departmentId: true },
  });
}

function assertDepartmentAccess(
  employee: { id: string; departmentId: string | null },
  requesterEmployee: { id: string; departmentId: string | null } | null,
  user?: JwtUser
) {
  if (canManageAll(user)) return;
  if (!hasGeneratePermission(user)) {
    throw { status: 403, message: "You do not have permission to generate ID cards." };
  }
  if (user?.employeeId && user.employeeId === employee.id) {
    return;
  }
  if (requesterEmployee?.departmentId && requesterEmployee.departmentId === employee.departmentId) {
    return;
  }
  throw { status: 403, message: "You can only generate ID cards for employees in your department." };
}

async function recordGeneration({
  employeeId,
  templateId,
  generatedById,
  pdfUrl,
  pngUrl,
  metadata,
  mode,
  zipUrl,
}: {
  employeeId: string;
  templateId: string;
  generatedById: string;
  pdfUrl: string;
  pngUrl: string;
  metadata: Prisma.JsonValue;
  mode: "SINGLE" | "BATCH";
  zipUrl?: string;
}) {
  const [record] = await prisma.$transaction([
    prisma.employeeIdCard.create({
      data: {
        employeeId,
        templateId,
        generatedById,
        pdfUrl,
        pngUrl,
        metadata,
        mode,
        zipUrl,
      },
    }),
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        idCardGeneratedAt: new Date(),
        idCardTemplateId: templateId,
        idCardPdfUrl: pdfUrl,
        idCardPngUrl: pngUrl,
      },
    }),
  ]);
  return record;
}

async function zipPdfFiles(entries: { filePath: string; name: string }[]) {
  const zipName = `employee-id-batch-${Date.now()}.zip`;
  const zipFullPath = path.join(idCardsDir, zipName);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipFullPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    entries.forEach((entry) => {
      if (fs.existsSync(entry.filePath)) {
        archive.file(entry.filePath, { name: entry.name });
      }
    });
    archive.finalize();
    output.on("close", () => resolve());
    archive.on("error", (error) => reject(error));
  });
  return {
    zipUrl: `/uploads/id-cards/${zipName}`,
    zipPath: zipFullPath,
  };
}

export async function listIdCardTemplates(req: Request, res: Response) {
  const templates = await prisma.employeeIdTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json(templates);
}

export async function createIdCardTemplate(req: Request, res: Response) {
  const body = CreateIdCardTemplateDto.parse(req.body);
  const user = (req as any).user as JwtUser | undefined;
  const template = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.employeeIdTemplate.updateMany({ data: { isDefault: false } });
    }
    return tx.employeeIdTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        settings: body.settings,
        isDefault: body.isDefault ?? false,
        createdById: user?.id,
        updatedById: user?.id,
      },
    });
  });
  res.status(201).json(template);
}

export async function updateIdCardTemplate(req: Request, res: Response) {
  const { templateId } = req.params as { templateId: string };
  const body = UpdateIdCardTemplateDto.parse(req.body);
  const user = (req as any).user as JwtUser | undefined;
  const template = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.employeeIdTemplate.updateMany({
        where: { id: { not: templateId } },
        data: { isDefault: false },
      });
    }
    return tx.employeeIdTemplate.update({
      where: { id: templateId },
      data: {
        name: body.name,
        description: body.description,
        settings: body.settings ? body.settings : undefined,
        isDefault: body.isDefault ?? undefined,
        updatedById: user?.id,
      },
    });
  });
  res.json(template);
}

export async function deleteIdCardTemplate(req: Request, res: Response) {
  const { templateId } = req.params as { templateId: string };
  const template = await prisma.employeeIdTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }
  await prisma.employeeIdTemplate.delete({ where: { id: templateId } });
  res.status(204).send();
}

export async function setDefaultIdCardTemplate(req: Request, res: Response) {
  const { templateId } = req.params as { templateId: string };
  const template = await prisma.$transaction(async (tx) => {
    await tx.employeeIdTemplate.updateMany({ data: { isDefault: false } });
    return tx.employeeIdTemplate.update({
      where: { id: templateId },
      data: { isDefault: true },
    });
  });
  res.json(template);
}

export async function generateEmployeeIdCard(req: Request, res: Response) {
  const { id } = req.params;
  const body = GenerateIdCardDto.parse(req.body ?? {});
  const user = (req as any).user as JwtUser | undefined;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: { select: { name: true, id: true } } },
  });
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  if (employee.status !== "ACTIVE") {
    return res.status(400).json({ message: "Only active employees can have ID cards generated." });
  }
  const requesterEmployee = await ensureRequesterEmployee(user);
  if (!canManageAll(user)) {
    assertDepartmentAccess(employee, requesterEmployee, user);
  }
  const template = await resolveTemplate(body.templateId);
  if (!template) {
    return res.status(400).json({ message: "No ID card template available." });
  }
  const settings = parseSettings(template.settings);
  const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  const assets = await generateIdCardAssets({
    employee,
    template,
    settings,
    issueDate,
    expiryDate,
    codeType: body.codeType ?? settings.codeType ?? "QR",
  });
  const record = await recordGeneration({
    employeeId: employee.id,
    templateId: template.id,
    generatedById: user?.id ?? "system",
    pdfUrl: assets.pdfUrl,
    pngUrl: assets.pngUrl,
    metadata: assets.metadata,
    mode: "SINGLE",
  });
  res.json({
    employeeId: employee.id,
    pdfUrl: assets.pdfUrl,
    pngUrl: assets.pngUrl,
    metadata: record.metadata,
    template,
  });
}

export async function batchGenerateEmployeeIdCards(req: Request, res: Response) {
  const body = BatchGenerateIdCardDto.parse(req.body);
  const user = (req as any).user as JwtUser | undefined;
  if (!canManageAll(user)) {
    return res.status(403).json({ message: "Only HR/Admin can batch-generate ID cards." });
  }
  const employees = await prisma.employee.findMany({
    where: { id: { in: body.employeeIds } },
    include: { department: { select: { name: true } } },
  });
  if (employees.length === 0) {
    return res.status(404).json({ message: "No employees found for supplied IDs." });
  }
  const inactive = employees.filter((emp) => emp.status !== "ACTIVE");
  if (inactive.length > 0) {
    return res.status(400).json({
      message: "All employees must be active before generating ID cards.",
      inactiveEmployees: inactive.map((emp) => ({ id: emp.id, name: `${emp.firstName} ${emp.lastName}` })),
    });
  }
  const missingIds = body.employeeIds.filter((id) => !employees.some((emp) => emp.id === id));
  if (missingIds.length > 0) {
    return res.status(404).json({ message: "Some employees were not found", missingIds });
  }
  const template = await resolveTemplate(body.templateId);
  if (!template) {
    return res.status(400).json({ message: "No ID card template available." });
  }
  const settings = parseSettings(template.settings);
  const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;

  const pdfEntries: { filePath: string; name: string }[] = [];
  const results = [];
  for (const employee of employees) {
    const assets = await generateIdCardAssets({
      employee,
      template,
      settings,
      issueDate,
      expiryDate,
      codeType: settings.codeType ?? "QR",
    });
    const pdfFullPath = path.join(uploadsRoot, assets.pdfUrl.replace("/uploads", ""));
    pdfEntries.push({
      filePath: pdfFullPath,
      name: `${employee.employeeCode}-${employee.firstName}-${employee.lastName}.pdf`,
    });
    await recordGeneration({
      employeeId: employee.id,
      templateId: template.id,
      generatedById: user?.id ?? "system",
      pdfUrl: assets.pdfUrl,
      pngUrl: assets.pngUrl,
      metadata: assets.metadata,
      mode: "BATCH",
    });
    results.push({
      employeeId: employee.id,
      pdfUrl: assets.pdfUrl,
      pngUrl: assets.pngUrl,
    });
  }
  const zipResult = await zipPdfFiles(pdfEntries);
  await prisma.employeeIdCard.updateMany({
    where: {
      employeeId: { in: employees.map((emp) => emp.id) },
      mode: "BATCH",
      zipUrl: null,
    },
    data: { zipUrl: zipResult.zipUrl },
  });
  res.json({
    results,
    zipUrl: zipResult.zipUrl,
  });
}

