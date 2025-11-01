import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesQuery } from "./employee.dto.js";
import { paginate } from "../../lib/paginate.js";
import { nextEmployeeCode } from "../../lib/employee-code.js";
import path from "path";

const prisma = new PrismaClient();

// Extend Request type to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

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
      include: { 
        department: true, 
        manager: { select: { id: true, firstName: true, lastName: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          }
        }
      },
    }),
    prisma.employee.count({ where }),
  ]);

  // Convert Decimal salary to number for JSON serialization
  const serializedItems = items.map(emp => ({
    ...emp,
    salary: emp.salary ? Number(emp.salary) : null,
  }));

  res.json({ items: serializedItems, total, page, pageSize });
}

export async function getEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, manager: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!emp) return res.status(404).json({ message: "Employee not found" });
  
  // Convert Decimal salary to number for JSON serialization
  const serialized = {
    ...emp,
    salary: emp.salary ? Number(emp.salary) : null,
  };
  
  res.json(serialized);
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const dto = CreateEmployeeDto.parse(req.body);

    const count = await prisma.employee.count(); // simple sequence
    const employeeCode = nextEmployeeCode(count + 1);

    // Create employee and automatically create user account with EMPLOYEE role
    const emp = await prisma.$transaction(async (tx) => {
      const newEmp = await tx.employee.create({
        data: {
          employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone || null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender && dto.gender.trim() !== "" ? dto.gender : null,
          address: dto.address || null,
          emergencyContact: dto.emergencyContact || null,
          designation: dto.designation || null,
          employmentType: dto.employmentType || null,
          educationLevel: dto.educationLevel && dto.educationLevel.trim() !== "" ? dto.educationLevel : null,
          educationOther: dto.educationOther && dto.educationOther.trim() !== "" ? dto.educationOther : null,
          marriageStatus: dto.marriageStatus && dto.marriageStatus.trim() !== "" ? dto.marriageStatus : null,
          document: dto.document && dto.document.trim() !== "" ? dto.document : null,
          status: dto.status || "ACTIVE",
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : null,
          salary: dto.salary ?? null,
          departmentId: dto.departmentId && dto.departmentId.trim() !== "" ? dto.departmentId : null,
          managerId: dto.managerId && dto.managerId.trim() !== "" ? dto.managerId : null,
        },
      });

      // Automatically create user account with EMPLOYEE role
      try {
        // Find EMPLOYEE role
        const employeeRole = await tx.role.findUnique({
          where: { name: "EMPLOYEE" },
        });

        if (employeeRole) {
          // Check if user already exists with this email
          const existingUser = await tx.user.findUnique({
            where: { email: dto.email },
          });

          if (!existingUser) {
            // Generate default password (employee email + employeeCode)
            const defaultPassword = `${dto.email}${employeeCode}`;
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            // Create user account
            const user = await tx.user.create({
              data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                status: dto.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
              },
            });

            // Assign EMPLOYEE role
            await tx.userRole.create({
              data: {
                userId: user.id,
                roleId: employeeRole.id,
              },
            });

            // Link employee to user
            await tx.employee.update({
              where: { id: newEmp.id },
              data: { userId: user.id },
            });
          }
        }
      } catch (userError: any) {
        // If user creation fails, log but don't fail employee creation
        console.error("Failed to auto-create user account for employee:", userError);
        // Employee is still created, but without user account
      }

      // Reload employee with all relations
      return await tx.employee.findUnique({
        where: { id: newEmp.id },
        include: { 
          department: true, 
          manager: { select: { id: true, firstName: true, lastName: true } },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
            }
          }
        },
      });
    });

    // Convert Decimal salary to number for JSON serialization
    const serialized = {
      ...emp,
      salary: emp!.salary ? Number(emp!.salary) : null,
    };

    res.status(201).json(serialized);
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

  const updateData: any = {};
  
  if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
  if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
  if (dto.email !== undefined) updateData.email = dto.email;
  if (dto.phone !== undefined) updateData.phone = dto.phone === "" ? null : dto.phone;
  if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = dto.dateOfBirth === "" ? null : (dto.dateOfBirth ? new Date(dto.dateOfBirth) : null);
  if (dto.gender !== undefined) updateData.gender = dto.gender === "" ? null : dto.gender;
  if (dto.address !== undefined) updateData.address = dto.address === "" ? null : dto.address;
  if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact === "" ? null : dto.emergencyContact;
  if (dto.designation !== undefined) updateData.designation = dto.designation === "" ? null : dto.designation;
  if (dto.employmentType !== undefined) updateData.employmentType = dto.employmentType === "" ? null : dto.employmentType;
  if (dto.educationLevel !== undefined) updateData.educationLevel = dto.educationLevel === "" ? null : dto.educationLevel;
  if (dto.educationOther !== undefined) updateData.educationOther = dto.educationOther === "" ? null : dto.educationOther;
  if (dto.marriageStatus !== undefined) updateData.marriageStatus = dto.marriageStatus === "" ? null : dto.marriageStatus;
  if (dto.document !== undefined) updateData.document = dto.document === "" ? null : dto.document;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.joiningDate !== undefined) updateData.joiningDate = dto.joiningDate === "" ? null : (dto.joiningDate ? new Date(dto.joiningDate) : null);
  if (dto.salary !== undefined) updateData.salary = dto.salary ?? null;
  if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId === "" || dto.departmentId.trim() === "" ? null : dto.departmentId;
  if (dto.managerId !== undefined) updateData.managerId = dto.managerId === "" || dto.managerId.trim() === "" ? null : dto.managerId;

  const emp = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: { 
      department: true, 
      manager: { select: { id: true, firstName: true, lastName: true } },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        }
      }
    },
  });

  // Sync status with user if employee has linked user and status is being updated
  if (dto.status !== undefined && emp.user) {
    const userStatus = dto.status === "ACTIVE" || dto.status === "ON_LEAVE" ? "ACTIVE" : "INACTIVE";
    await prisma.user.update({
      where: { id: emp.user.id },
      data: { status: userStatus },
    });
  }

  // Convert Decimal salary to number for JSON serialization
  const serialized = {
    ...emp,
    salary: emp.salary ? Number(emp.salary) : null,
  };

  res.json(serialized);
}

export async function deleteEmployee(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.employee.delete({ where: { id } });
  res.status(204).send();
}

export async function uploadDocument(req: MulterRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct the URL path where the file will be accessible
    // The file is stored in uploads/employee-documents/
    // Static files are served from /uploads, so we need to include the subdirectory
    const fileUrl = `/uploads/employee-documents/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    res.status(500).json({ message: "Failed to upload document", error: error.message });
  }
}
