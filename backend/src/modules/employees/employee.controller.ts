import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { CreateEmployeeDto, UpdateEmployeeDto, ListEmployeesQuery } from "./employee.dto.js";
import { paginate } from "../../lib/paginate.js";
import { nextEmployeeCode } from "../../lib/employee-code.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export async function downloadSampleTemplate(req: Request, res: Response) {
  try {
    // Create CSV sample template
    const headers = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "emergencyContact",
      "designation",
      "employmentType",
      "educationLevel",
      "educationOther",
      "marriageStatus",
      "status",
      "joiningDate",
      "salary",
      "departmentId",
      "managerId"
    ];
    
    const sampleRow = [
      "John",
      "Doe",
      "john.doe@company.com",
      "+1234567890",
      "1990-01-15",
      "MALE",
      "123 Main St",
      "+1234567891",
      "Software Engineer",
      "FULL_TIME",
      "DEGREE",
      "",
      "SINGLE",
      "ACTIVE",
      "2024-01-01",
      "50000",
      "",
      ""
    ];

    const csvContent = [
      headers.join(","),
      sampleRow.join(","),
      "",
      "Notes:",
      "- Date format: YYYY-MM-DD",
      "- Gender: MALE, FEMALE, or OTHER",
      "- Employment Type: FULL_TIME, PART_TIME, CONTRACT, INTERN, or TEMPORARY",
      "- Education Level: GRADE_8, GRADE_10, GRADE_12, DEGREE, MASTER, PHD, or OTHER",
      "- Marriage Status: SINGLE, MARRIED, DIVORCED, or WIDOWED",
      "- Status: ACTIVE, INACTIVE, or ON_LEAVE",
      "- departmentId and managerId should be UUIDs from the system (leave empty if not applicable)"
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employee_import_template.csv");
    res.send(csvContent);
  } catch (error: any) {
    console.error("Failed to generate sample template:", error);
    res.status(500).json({ message: "Failed to generate sample template" });
  }
}

export async function bulkImportEmployees(req: MulterRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let employees: any[] = [];

    // Parse CSV or Excel file
    if (fileExtension === ".csv") {
      // Simple CSV parser (can be enhanced with papaparse)
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const lines = fileContent.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must have at least a header row and one data row" });
      }

      const headers = lines[0].split(",").map(h => h.trim());
      const dataRows = lines.slice(1);

      employees = dataRows.map((row, index) => {
        const values = row.split(",").map(v => v.trim());
        const employee: any = {};
        
        headers.forEach((header, i) => {
          const value = values[i] || "";
          if (value) {
            employee[header] = value;
          }
        });
        
        return { row: index + 2, data: employee }; // row number for error reporting
      }).filter(item => Object.keys(item.data).length > 0);
    } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      // For Excel, we'll need xlsx library
      // For now, return error asking user to convert to CSV
      return res.status(400).json({ 
        message: "Excel files are not yet supported. Please convert to CSV format." 
      });
    } else {
      return res.status(400).json({ 
        message: "Unsupported file format. Please upload a CSV file." 
      });
    }

    if (employees.length === 0) {
      return res.status(400).json({ message: "No employee data found in the file" });
    }

    // Validate and create employees
    const results = {
      total: employees.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email?: string; error: string }>,
    };

    // Get all existing emails to check for duplicates
    const existingEmails = new Set(
      (await prisma.employee.findMany({ select: { email: true } })).map(e => e.email.toLowerCase())
    );

    // Get employee count for generating codes
    const currentCount = await prisma.employee.count();

    // Get EMPLOYEE role for auto-creating user accounts
    const employeeRole = await prisma.role.findUnique({
      where: { name: "EMPLOYEE" },
    });

    // Process employees in batches
    for (let i = 0; i < employees.length; i++) {
      const { row, data } = employees[i];
      
      try {
        // Validate required fields
        if (!data.firstName || !data.lastName || !data.email) {
          results.failed++;
          results.errors.push({
            row,
            email: data.email,
            error: "Missing required fields: firstName, lastName, and email are required",
          });
          continue;
        }

        // Check for duplicate email
        if (existingEmails.has(data.email.toLowerCase())) {
          results.failed++;
          results.errors.push({
            row,
            email: data.email,
            error: "Email already exists in the system",
          });
          continue;
        }

        // Map CSV data to DTO format
        const employeeCode = nextEmployeeCode(currentCount + results.successful + 1);
        
        const dto: any = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          gender: data.gender || undefined,
          address: data.address || undefined,
          emergencyContact: data.emergencyContact || undefined,
          designation: data.designation || undefined,
          employmentType: data.employmentType || undefined,
          educationLevel: data.educationLevel || undefined,
          educationOther: data.educationOther || undefined,
          marriageStatus: data.marriageStatus || undefined,
          status: data.status || "ACTIVE",
          joiningDate: data.joiningDate || undefined,
          salary: data.salary ? Number(data.salary) : undefined,
          departmentId: data.departmentId || undefined,
          managerId: data.managerId || undefined,
        };

        // Validate with DTO
        const validatedDto = CreateEmployeeDto.parse(dto);

        // Create employee with user account in transaction
        await prisma.$transaction(async (tx) => {
          const newEmp = await tx.employee.create({
            data: {
              employeeCode,
              firstName: validatedDto.firstName,
              lastName: validatedDto.lastName,
              email: validatedDto.email,
              phone: validatedDto.phone || null,
              dateOfBirth: validatedDto.dateOfBirth ? new Date(validatedDto.dateOfBirth) : null,
              gender: validatedDto.gender && validatedDto.gender.trim() !== "" ? validatedDto.gender : null,
              address: validatedDto.address || null,
              emergencyContact: validatedDto.emergencyContact || null,
              designation: validatedDto.designation || null,
              employmentType: validatedDto.employmentType || null,
              educationLevel: validatedDto.educationLevel && validatedDto.educationLevel.trim() !== "" ? validatedDto.educationLevel : null,
              educationOther: validatedDto.educationOther && validatedDto.educationOther.trim() !== "" ? validatedDto.educationOther : null,
              marriageStatus: validatedDto.marriageStatus && validatedDto.marriageStatus.trim() !== "" ? validatedDto.marriageStatus : null,
              status: validatedDto.status || "ACTIVE",
              joiningDate: validatedDto.joiningDate ? new Date(validatedDto.joiningDate) : null,
              salary: validatedDto.salary ?? null,
              departmentId: validatedDto.departmentId && validatedDto.departmentId.trim() !== "" ? validatedDto.departmentId : null,
              managerId: validatedDto.managerId && validatedDto.managerId.trim() !== "" ? validatedDto.managerId : null,
            },
          });

          // Auto-create user account if EMPLOYEE role exists
          if (employeeRole) {
            try {
              const existingUser = await tx.user.findUnique({
                where: { email: validatedDto.email },
              });

              if (!existingUser) {
                const defaultPassword = `${validatedDto.email}${employeeCode}`;
                const passwordHash = await bcrypt.hash(defaultPassword, 10);

                const user = await tx.user.create({
                  data: {
                    email: validatedDto.email,
                    passwordHash,
                    firstName: validatedDto.firstName,
                    lastName: validatedDto.lastName,
                    status: validatedDto.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                  },
                });

                await tx.userRole.create({
                  data: {
                    userId: user.id,
                    roleId: employeeRole.id,
                  },
                });

                await tx.employee.update({
                  where: { id: newEmp.id },
                  data: { userId: user.id },
                });
              }
            } catch (userError) {
              // Log but don't fail employee creation
              console.error(`Failed to create user account for ${validatedDto.email}:`, userError);
            }
          }

          existingEmails.add(validatedDto.email.toLowerCase());
        });

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row,
          email: data.email,
          error: error.message || "Validation failed",
        });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded file:", cleanupError);
    }

    res.json({
      message: `Bulk import completed. ${results.successful} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    res.status(500).json({ 
      message: "Failed to process bulk import", 
      error: error.message 
    });
  }
}
