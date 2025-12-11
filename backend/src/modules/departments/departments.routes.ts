<<<<<<< HEAD
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { Department } from "../../entities/Department.js";
import { Employee } from "../../entities/Employee.js";
=======
import { Router } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
>>>>>>> dev

const router = Router();

// GET /api/v1/departments - List departments
router.get("/", async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const deptRepo = AppDataSource.getRepository(Department);
    const empRepo = AppDataSource.getRepository(Employee);
    
    const departments = await deptRepo.find({
      order: { name: "ASC" },
      relations: ["employees"]
    });
    
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const count = await empRepo.count({ where: { departmentId: dept.id } });
        return { ...dept, _count: { employees: count } };
      })
    );
    
    res.json(departmentsWithCount);
=======
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employee: {
              select: {
                id: true,
                employeeCode: true,
                designation: true
              }
            }
          }
        },
        _count: {
          select: { employees: true }
        }
      }
    });
    res.json(departments);
>>>>>>> dev
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

// GET /api/v1/departments/:id - Get specific department
router.get("/:id", async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const deptRepo = AppDataSource.getRepository(Department);
    const department = await deptRepo.findOne({
      where: { id: req.params.id },
      relations: ["employees"]
=======
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employee: {
              select: {
                id: true,
                employeeCode: true,
                designation: true
              }
            }
          }
        },
        employees: true
      }
>>>>>>> dev
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
<<<<<<< HEAD
    const { name } = req.body;
=======
    const { name, managerId } = req.body;
>>>>>>> dev
    
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    
<<<<<<< HEAD
    const deptRepo = AppDataSource.getRepository(Department);
    const dept = new Department();
    dept.id = uuidv4();
    dept.name = name;
    
    const department = await deptRepo.save(dept);
    
    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === '23505') {
=======
    if (!managerId) {
      return res.status(400).json({ message: "Department manager is required" });
    }
    
    // Check if user is already a manager of another department
    const existingManagerDept = await prisma.department.findFirst({
      where: {
        managerId: managerId
      }
    });
    
    if (existingManagerDept) {
      return res.status(400).json({ 
        message: `This user is already the manager of "${existingManagerDept.name}" department. A user can only manage one department.` 
      });
    }
    
    // Get the manager's employee record
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { employee: true }
    });
    
    if (!manager) {
      return res.status(404).json({ message: "Manager user not found" });
    }
    
    if (manager.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Only active users can be assigned as department managers" });
    }
    
    // Create department and assign manager in a transaction
    const department = await prisma.$transaction(async (tx) => {
      // Create the department
      const dept = await tx.department.create({
        data: { 
          name,
          managerId: managerId
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  designation: true
                }
              }
            }
          }
        }
      });
      
      // If manager has an employee record, assign them to this department and remove from others
      if (manager.employee) {
        await tx.employee.update({
          where: { id: manager.employee.id },
          data: {
            departmentId: dept.id
          }
        });
      }
      
      return dept;
    });
    
    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
>>>>>>> dev
      res.status(409).json({ message: "Department with this name already exists" });
    } else {
      res.status(500).json({ message: "Failed to create department" });
    }
  }
});

// PUT /api/v1/departments/:id - Update department
router.put("/:id", async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const { name } = req.body;
=======
    const { name, managerId } = req.body;
>>>>>>> dev
    
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    
<<<<<<< HEAD
    const deptRepo = AppDataSource.getRepository(Department);
    const department = await deptRepo.findOne({ where: { id: req.params.id } });
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    department.name = name;
    const updated = await deptRepo.save(department);
    
    res.json(updated);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ message: "Department with this name already exists" });
=======
    if (!managerId) {
      return res.status(400).json({ message: "Department manager is required" });
    }
    
    // Check if user is already a manager of another department
    const existingManagerDept = await prisma.department.findFirst({
      where: {
        managerId: managerId,
        id: { not: req.params.id } // Any department except the current one
      }
    });
    
    if (existingManagerDept) {
      return res.status(400).json({ 
        message: `This user is already the manager of "${existingManagerDept.name}" department. A user can only manage one department.` 
      });
    }
    
    // Get the manager's employee record
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { employee: true }
    });
    
    if (!manager) {
      return res.status(404).json({ message: "Manager user not found" });
    }
    
    if (manager.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Only active users can be assigned as department managers" });
    }
    
    // Update department and assign manager in a transaction
    const department = await prisma.$transaction(async (tx) => {
      // Get current department to check old manager
      const currentDept = await tx.department.findUnique({
        where: { id: req.params.id },
        include: { manager: { include: { employee: true } } }
      });
      
      if (!currentDept) {
        throw new Error("Department not found");
      }
      
      // Update the department
      const dept = await tx.department.update({
        where: { id: req.params.id },
        data: { 
          name,
          managerId: managerId
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  designation: true
                }
              }
            }
          }
        }
      });
      
      // If manager has an employee record, assign them to this department
      if (manager.employee) {
        await tx.employee.update({
          where: { id: manager.employee.id },
          data: {
            departmentId: dept.id
          }
        });
      }
      
      return dept;
    });
    
    res.json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: "Department with this name already exists" });
    } else if (error.code === 'P2025') {
      res.status(404).json({ message: "Department not found" });
    } else if (error.message === "Department not found") {
      res.status(404).json({ message: "Department not found" });
>>>>>>> dev
    } else {
      res.status(500).json({ message: "Failed to update department" });
    }
  }
});

// DELETE /api/v1/departments/:id - Delete department
router.delete("/:id", async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    const deptRepo = AppDataSource.getRepository(Department);
    const empRepo = AppDataSource.getRepository(Employee);
    
    const department = await deptRepo.findOne({ where: { id: req.params.id } });
=======
    // Check if department has employees
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { employees: true } } }
    });
>>>>>>> dev
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
<<<<<<< HEAD
    const employeeCount = await empRepo.count({ where: { departmentId: req.params.id } });
    
    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department with ${employeeCount} employee(s). Please reassign or remove employees first.` 
      });
    }
    
    await deptRepo.remove(department);
    
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete department" });
=======
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
>>>>>>> dev
  }
});

export default router;
