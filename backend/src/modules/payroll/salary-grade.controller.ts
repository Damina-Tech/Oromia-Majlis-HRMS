import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  CreateSalaryGradeDto,
  UpdateSalaryGradeDto,
  CreateSalaryStepDto,
  UpdateSalaryStepDto,
} from "./salary-grade.dto.js";

const prisma = new PrismaClient();

// ========== Salary Grade CRUD ==========

export async function createSalaryGrade(req: Request, res: Response) {
  try {
    const dto = CreateSalaryGradeDto.parse(req.body);

    const grade = await prisma.salaryGrade.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        minSalary: new Prisma.Decimal(dto.minSalary),
        maxSalary: new Prisma.Decimal(dto.maxSalary),
      },
    });

    return res.status(201).json(grade);
  } catch (error: any) {
    console.error("Create salary grade error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Grade name or code already exists" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create salary grade" });
  }
}

export async function listSalaryGrades(req: Request, res: Response) {
  try {
    const grades = await prisma.salaryGrade.findMany({
      include: {
        steps: {
          orderBy: { step: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });

    return res.status(200).json(grades);
  } catch (error: any) {
    console.error("List salary grades error:", error);
    return res.status(500).json({ message: "Failed to list salary grades" });
  }
}

export async function getSalaryGrade(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const grade = await prisma.salaryGrade.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { step: "asc" },
        },
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    if (!grade) {
      return res.status(404).json({ message: "Salary grade not found" });
    }

    return res.status(200).json(grade);
  } catch (error: any) {
    console.error("Get salary grade error:", error);
    return res.status(500).json({ message: "Failed to get salary grade" });
  }
}

export async function updateSalaryGrade(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateSalaryGradeDto.parse(req.body);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.code) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.minSalary !== undefined) updateData.minSalary = new Prisma.Decimal(dto.minSalary);
    if (dto.maxSalary !== undefined) updateData.maxSalary = new Prisma.Decimal(dto.maxSalary);

    const grade = await prisma.salaryGrade.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(grade);
  } catch (error: any) {
    console.error("Update salary grade error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Grade name or code already exists" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update salary grade" });
  }
}

export async function deleteSalaryGrade(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if grade has employees
    const employeeCount = await prisma.employee.count({
      where: { salaryGradeId: id },
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete grade. It is assigned to ${employeeCount} employee(s).`,
      });
    }

    await prisma.salaryGrade.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete salary grade error:", error);
    return res.status(500).json({ message: "Failed to delete salary grade" });
  }
}

// ========== Salary Step CRUD ==========

export async function createSalaryStep(req: Request, res: Response) {
  try {
    const dto = CreateSalaryStepDto.parse(req.body);

    // Verify grade exists
    const grade = await prisma.salaryGrade.findUnique({
      where: { id: dto.gradeId },
    });

    if (!grade) {
      return res.status(404).json({ message: "Salary grade not found" });
    }

    // Check if step number already exists
    const existingStep = await prisma.salaryStep.findUnique({
      where: {
        gradeId_step: {
          gradeId: dto.gradeId,
          step: dto.step,
        },
      },
    });

    if (existingStep) {
      return res.status(400).json({ message: `Step ${dto.step} already exists for this grade` });
    }

    // Verify salary is within grade range
    const minSalary = parseFloat(grade.minSalary.toString());
    const maxSalary = parseFloat(grade.maxSalary.toString());
    if (dto.salary < minSalary || dto.salary > maxSalary) {
      return res.status(400).json({
        message: `Salary must be between ${minSalary} and ${maxSalary} for this grade`,
      });
    }

    const step = await prisma.salaryStep.create({
      data: {
        gradeId: dto.gradeId,
        step: dto.step,
        salary: new Prisma.Decimal(dto.salary),
      },
    });

    return res.status(201).json(step);
  } catch (error: any) {
    console.error("Create salary step error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Step number already exists for this grade" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create salary step" });
  }
}

export async function listSalarySteps(req: Request, res: Response) {
  try {
    const { gradeId } = req.query;

    const where: any = {};
    if (gradeId) where.gradeId = gradeId as string;

    const steps = await prisma.salaryStep.findMany({
      where,
      include: {
        grade: true,
      },
      orderBy: [
        { grade: { code: "asc" } },
        { step: "asc" },
      ],
    });

    return res.status(200).json(steps);
  } catch (error: any) {
    console.error("List salary steps error:", error);
    return res.status(500).json({ message: "Failed to list salary steps" });
  }
}

export async function getSalaryStep(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const step = await prisma.salaryStep.findUnique({
      where: { id },
      include: {
        grade: true,
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });

    if (!step) {
      return res.status(404).json({ message: "Salary step not found" });
    }

    return res.status(200).json(step);
  } catch (error: any) {
    console.error("Get salary step error:", error);
    return res.status(500).json({ message: "Failed to get salary step" });
  }
}

export async function updateSalaryStep(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateSalaryStepDto.parse(req.body);

    const existing = await prisma.salaryStep.findUnique({
      where: { id },
      include: { grade: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Salary step not found" });
    }

    const updateData: any = {};
    if (dto.step !== undefined) {
      // Check if new step number conflicts
      if (dto.step !== existing.step) {
        const conflict = await prisma.salaryStep.findUnique({
          where: {
            gradeId_step: {
              gradeId: existing.gradeId,
              step: dto.step,
            },
          },
        });

        if (conflict) {
          return res.status(400).json({ message: `Step ${dto.step} already exists for this grade` });
        }
      }
      updateData.step = dto.step;
    }

    if (dto.salary !== undefined) {
      const minSalary = parseFloat(existing.grade.minSalary.toString());
      const maxSalary = parseFloat(existing.grade.maxSalary.toString());
      if (dto.salary < minSalary || dto.salary > maxSalary) {
        return res.status(400).json({
          message: `Salary must be between ${minSalary} and ${maxSalary} for this grade`,
        });
      }
      updateData.salary = new Prisma.Decimal(dto.salary);
    }

    const step = await prisma.salaryStep.update({
      where: { id },
      data: updateData,
      include: { grade: true },
    });

    return res.status(200).json(step);
  } catch (error: any) {
    console.error("Update salary step error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Step number already exists for this grade" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update salary step" });
  }
}

export async function deleteSalaryStep(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if step has employees
    const employeeCount = await prisma.employee.count({
      where: { salaryStepId: id },
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete step. It is assigned to ${employeeCount} employee(s).`,
      });
    }

    await prisma.salaryStep.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete salary step error:", error);
    return res.status(500).json({ message: "Failed to delete salary step" });
  }
}

