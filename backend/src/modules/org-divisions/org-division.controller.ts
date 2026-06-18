import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  CreateDivisionAssignmentDto,
  ListDivisionAssignmentsQuery,
  UpdateDivisionAssignmentDto,
  UpdateOrgDivisionDto,
} from "./org-division.dto.js";
import { isSuperAdminUser } from "./division-access.js";

const prisma = new PrismaClient();

function assertAccessControl(req: Request, res: Response): boolean {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ message: "Unauthenticated" });
    return false;
  }
  if (
    !isSuperAdminUser(user) &&
    !user.permissions.includes("divisions.manage") &&
    !user.permissions.includes("system.admin")
  ) {
    res.status(403).json({ message: "Forbidden: system admin or divisions.manage required" });
    return false;
  }
  return true;
}

export async function listOrgDivisions(_req: Request, res: Response) {
  try {
    const divisions = await prisma.orgDivision.findMany({
      orderBy: { code: "asc" },
      include: {
        headUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { assignments: true } },
      },
    });
    res.json({ items: divisions });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to list divisions" });
  }
}

export async function getOrgDivision(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const division = await prisma.orgDivision.findFirst({
      where: { OR: [{ id }, { code: id as any }] },
      include: {
        headUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
            role: { select: { id: true, name: true, description: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
    if (!division) return res.status(404).json({ message: "Division not found" });
    res.json(division);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Failed to load division" });
  }
}

export async function updateOrgDivision(req: Request, res: Response) {
  if (!assertAccessControl(req, res)) return;
  try {
    const { id } = req.params;
    const data = UpdateOrgDivisionDto.parse(req.body);
    const existing = await prisma.orgDivision.findFirst({
      where: { OR: [{ id }, { code: id as any }] },
    });
    if (!existing) return res.status(404).json({ message: "Division not found" });

    const division = await prisma.orgDivision.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description === null ? null : data.description,
        headUserId: data.headUserId === null ? null : data.headUserId,
        active: data.active,
      },
      include: {
        headUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { assignments: true } },
      },
    });
    res.json(division);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update division" });
  }
}

export async function listDivisionAssignments(req: Request, res: Response) {
  try {
    const query = ListDivisionAssignmentsQuery.parse(req.query);
    const items = await prisma.userDivisionAssignment.findMany({
      where: {
        divisionId: query.divisionId,
        userId: query.userId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
        division: { select: { id: true, code: true, name: true } },
        role: { select: { id: true, name: true, description: true } },
      },
      orderBy: [{ division: { code: "asc" } }, { assignedAt: "desc" }],
    });
    res.json({ items });
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to list assignments" });
  }
}

export async function createDivisionAssignment(req: Request, res: Response) {
  if (!assertAccessControl(req, res)) return;
  try {
    const data = CreateDivisionAssignmentDto.parse(req.body);

    if (data.isPrimary) {
      await prisma.userDivisionAssignment.updateMany({
        where: { userId: data.userId },
        data: { isPrimary: false },
      });
    }

    const row = await prisma.userDivisionAssignment.create({
      data: {
        userId: data.userId,
        divisionId: data.divisionId,
        roleId: data.roleId,
        isPrimary: data.isPrimary ?? false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        division: { select: { id: true, code: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(row);
  } catch (e: any) {
    if (e.code === "P2002") {
      return res.status(409).json({ message: "User already has this role in this division" });
    }
    res.status(400).json({ message: e.message || "Failed to create assignment" });
  }
}

export async function updateDivisionAssignment(req: Request, res: Response) {
  if (!assertAccessControl(req, res)) return;
  try {
    const { id } = req.params;
    const data = UpdateDivisionAssignmentDto.parse(req.body);
    const existing = await prisma.userDivisionAssignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Assignment not found" });

    if (data.isPrimary) {
      await prisma.userDivisionAssignment.updateMany({
        where: { userId: existing.userId, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const row = await prisma.userDivisionAssignment.update({
      where: { id },
      data: {
        roleId: data.roleId,
        isPrimary: data.isPrimary,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        division: { select: { id: true, code: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Failed to update assignment" });
  }
}

export async function deleteDivisionAssignment(req: Request, res: Response) {
  if (!assertAccessControl(req, res)) return;
  try {
    const { id } = req.params;
    await prisma.userDivisionAssignment.delete({ where: { id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === "P2025") return res.status(404).json({ message: "Assignment not found" });
    res.status(400).json({ message: e.message || "Failed to delete assignment" });
  }
}
