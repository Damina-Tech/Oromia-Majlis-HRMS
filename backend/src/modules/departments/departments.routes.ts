import { Router } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

// GET /api/v1/departments - List departments
router.get("/", async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

// GET /api/v1/departments/:id - Get specific department
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        employees: true
      }
    });
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch department" });
  }
});

// POST /api/v1/departments - Create new department
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    
    const department = await prisma.department.create({
      data: { name }
    });
    
    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: "Department with this name already exists" });
    } else {
      res.status(500).json({ message: "Failed to create department" });
    }
  }
});

// PUT /api/v1/departments/:id - Update department
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: { name }
    });
    
    res.json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: "Department with this name already exists" });
    } else if (error.code === 'P2025') {
      res.status(404).json({ message: "Department not found" });
    } else {
      res.status(500).json({ message: "Failed to update department" });
    }
  }
});

// DELETE /api/v1/departments/:id - Delete department
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Check if department has employees
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { employees: true } } }
    });
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    if (department._count.employees > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department with ${department._count.employees} employee(s). Please reassign or remove employees first.` 
      });
    }
    
    await prisma.department.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: "Department not found" });
    } else {
      res.status(500).json({ message: "Failed to delete department" });
    }
  }
});

export default router;
