import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesQuery } from "./employee.dto.js";
import { paginate } from "../../lib/paginate.js";
import { nextEmployeeCode } from "../../lib/employee-code.js";

export async function listEmployees(req: Request, res: Response) {
  const { search, departmentId, status, page, pageSize } = ListEmployeesQuery.parse(req.query);
  const where: any = {};

  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;

  if (search) {
    const s = search.trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { employeeCode: { contains: s, mode: "insensitive" } },
      { designation: { contains: s, mode: "insensitive" } },
    ];
  }

  const { skip, take } = paginate(page, pageSize);

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      include: { department: true, manager: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.employee.count({ where }),
  ]);

  res.json({ items, total, page, pageSize });
}

export async function getEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, manager: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!emp) return res.status(404).json({ message: "Employee not found" });
  res.json(emp);
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const dto = CreateEmployeeDto.parse(req.body);

    const count = await prisma.employee.count(); // simple sequence
    const employeeCode = nextEmployeeCode(count + 1);

    const emp = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        address: dto.address || null,
        emergencyContact: dto.emergencyContact || null,
        designation: dto.designation || null,
        status: dto.status || "ACTIVE",
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
        salary: dto.salary ?? null,
        departmentId: dto.departmentId || null,
        managerId: dto.managerId || null,
      },
    });

    res.status(201).json(emp);
  } catch (error: any) {
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        message: "An employee with this email already exists in the system." 
      });
    }
    throw error;
  }
}

export async function updateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const dto = UpdateEmployeeDto.parse(req.body);

  const emp = await prisma.employee.update({
    where: { id },
    data: {
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      email: dto.email ?? undefined,
      phone: dto.phone === "" ? null : dto.phone,
      address: dto.address === "" ? null : dto.address,
      emergencyContact: dto.emergencyContact === "" ? null : dto.emergencyContact,
      designation: dto.designation === "" ? null : dto.designation,
      status: dto.status ?? undefined,
      joiningDate: dto.joiningDate === "" ? null : (dto.joiningDate ? new Date(dto.joiningDate) : undefined),
      salary: dto.salary ?? undefined,
      departmentId: dto.departmentId === "" ? null : dto.departmentId,
      managerId: dto.managerId === "" ? null : dto.managerId,
    },
  });

  res.json(emp);
}

export async function deleteEmployee(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.employee.delete({ where: { id } });
  res.status(204).send();
}
