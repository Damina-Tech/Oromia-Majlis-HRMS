import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../../db/data-source.js";
import { Employee, EmpStatus } from "../../entities/Employee.js";
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesQuery } from "./employee.dto.js";
import { paginate } from "../../lib/paginate.js";
import { nextEmployeeCode } from "../../lib/employee-code.js";

export async function listEmployees(req: Request, res: Response) {
  try {
    const { search, departmentId, status, page, pageSize } = ListEmployeesQuery.parse(req.query);
    const empRepo = AppDataSource.getRepository(Employee);
    const { skip, take } = paginate(page, pageSize);

    const queryBuilder = empRepo.createQueryBuilder("employee")
      .leftJoinAndSelect("employee.department", "department")
      .leftJoinAndSelect("employee.manager", "manager");

    if (departmentId) {
      queryBuilder.andWhere("employee.departmentId = :departmentId", { departmentId });
    }

    if (status) {
      queryBuilder.andWhere("employee.status = :status", { status });
    }

    if (search) {
      const s = search.trim();
      queryBuilder.andWhere(
        "(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search OR employee.employeeCode ILIKE :search OR employee.designation ILIKE :search)",
        { search: `%${s}%` }
      );
    }

    queryBuilder.orderBy("employee.createdAt", "DESC")
      .skip(skip)
      .take(take);

    const [items, total] = await queryBuilder.getManyAndCount();

    res.json({ items, total, page, pageSize });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
}

export async function getEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const empRepo = AppDataSource.getRepository(Employee);
    const emp = await empRepo.findOne({
      where: { id },
      relations: ["department", "manager"],
    });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee" });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const dto = CreateEmployeeDto.parse(req.body);
    const empRepo = AppDataSource.getRepository(Employee);

    const count = await empRepo.count();
    const employeeCode = nextEmployeeCode(count + 1);

    const emp = new Employee();
    emp.id = uuidv4();
    emp.employeeCode = employeeCode;
    emp.firstName = dto.firstName;
    emp.lastName = dto.lastName;
    emp.email = dto.email;
    emp.phone = dto.phone || undefined;
    emp.address = dto.address || undefined;
    emp.emergencyContact = dto.emergencyContact || undefined;
    emp.designation = dto.designation || undefined;
    emp.status = (dto.status || "ACTIVE") as EmpStatus;
    emp.joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : undefined;
    emp.salary = dto.salary?.toString() || undefined;
    emp.departmentId = dto.departmentId || undefined;
    emp.managerId = dto.managerId || undefined;

    const saved = await empRepo.save(emp);
    const withRelations = await empRepo.findOne({
      where: { id: saved.id },
      relations: ["department", "manager"],
    });

    res.status(201).json(withRelations);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ 
        message: "An employee with this email already exists in the system." 
      });
    }
    res.status(500).json({ message: "Failed to create employee" });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateEmployeeDto.parse(req.body);
    const empRepo = AppDataSource.getRepository(Employee);

    const emp = await empRepo.findOne({ where: { id } });
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    if (dto.firstName !== undefined) emp.firstName = dto.firstName;
    if (dto.lastName !== undefined) emp.lastName = dto.lastName;
    if (dto.email !== undefined) emp.email = dto.email;
    if (dto.phone !== undefined) emp.phone = dto.phone === "" ? undefined : dto.phone;
    if (dto.address !== undefined) emp.address = dto.address === "" ? undefined : dto.address;
    if (dto.emergencyContact !== undefined) emp.emergencyContact = dto.emergencyContact === "" ? undefined : dto.emergencyContact;
    if (dto.designation !== undefined) emp.designation = dto.designation === "" ? undefined : dto.designation;
    if (dto.status !== undefined) emp.status = dto.status as EmpStatus;
    if (dto.joiningDate !== undefined) emp.joiningDate = dto.joiningDate === "" ? undefined : (dto.joiningDate ? new Date(dto.joiningDate) : undefined);
    if (dto.salary !== undefined) emp.salary = dto.salary?.toString() || undefined;
    if (dto.departmentId !== undefined) emp.departmentId = dto.departmentId === "" ? undefined : dto.departmentId;
    if (dto.managerId !== undefined) emp.managerId = dto.managerId === "" ? undefined : dto.managerId;

    const updated = await empRepo.save(emp);
    const withRelations = await empRepo.findOne({
      where: { id: updated.id },
      relations: ["department", "manager"],
    });

    res.json(withRelations);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }
    res.status(500).json({ message: "Failed to update employee" });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const empRepo = AppDataSource.getRepository(Employee);
    const emp = await empRepo.findOne({ where: { id } });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    await empRepo.remove(emp);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee" });
  }
}
