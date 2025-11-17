import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { Department } from "../../entities/Department.js";
import { Employee } from "../../entities/Employee.js";

const router = Router();

// GET /api/v1/departments - List departments
router.get("/", async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

// GET /api/v1/departments/:id - Get specific department
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const deptRepo = AppDataSource.getRepository(Department);
    const department = await deptRepo.findOne({
      where: { id: req.params.id },
      relations: ["employees"]
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
    
    const deptRepo = AppDataSource.getRepository(Department);
    const dept = new Department();
    dept.id = uuidv4();
    dept.name = name;
    
    const department = await deptRepo.save(dept);
    
    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === '23505') {
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
    } else {
      res.status(500).json({ message: "Failed to update department" });
    }
  }
});

// DELETE /api/v1/departments/:id - Delete department
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deptRepo = AppDataSource.getRepository(Department);
    const empRepo = AppDataSource.getRepository(Employee);
    
    const department = await deptRepo.findOne({ where: { id: req.params.id } });
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
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
  }
});

export default router;
