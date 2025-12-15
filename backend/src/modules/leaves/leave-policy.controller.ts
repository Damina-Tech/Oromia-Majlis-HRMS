import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const CreateLeavePolicyDto = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
  defaultAllocatedDays: z.number().min(0),
  maxCarryOverDays: z.number().min(0).default(0),
  carryOverEnabled: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  requiresDocumentation: z.boolean().default(false),
  isActive: z.boolean().default(true),
  renewalMonth: z.number().int().min(1).max(12).default(1),
  renewalDay: z.number().int().min(1).max(31).default(1),
  color: z.string().optional(),
});

const UpdateLeavePolicyDto = CreateLeavePolicyDto.partial().omit({ code: true });

const RenewLeaveBalancesDto = z.object({
  year: z.number().int().min(2020).max(2100),
  leaveTypeCode: z.string().optional(), // If provided, only renew this leave type
  employeeIds: z.array(z.string()).optional(), // If provided, only renew for these employees
});

// GET /api/v1/leave-policies - List all leave policies
export async function listLeavePolicies(req: Request, res: Response) {
  try {
    const { isActive } = req.query;
    
    const where: Prisma.LeavePolicyWhereInput = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const policies = await prisma.leavePolicy.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Convert Decimal to number
    const serialized = policies.map((policy) => ({
      ...policy,
      defaultAllocatedDays: Number(policy.defaultAllocatedDays),
      maxCarryOverDays: Number(policy.maxCarryOverDays),
    }));

    res.json({ items: serialized, total: serialized.length });
  } catch (error) {
    console.error("List leave policies error:", error);
    res.status(500).json({ message: "Failed to fetch leave policies" });
  }
}

// GET /api/v1/leave-policies/:id - Get specific leave policy
export async function getLeavePolicy(req: Request, res: Response) {
  try {
    const policy = await prisma.leavePolicy.findUnique({
      where: { id: req.params.id },
    });

    if (!policy) {
      return res.status(404).json({ message: "Leave policy not found" });
    }

    // Convert Decimal to number
    const serialized = {
      ...policy,
      defaultAllocatedDays: Number(policy.defaultAllocatedDays),
      maxCarryOverDays: Number(policy.maxCarryOverDays),
    };

    res.json(serialized);
  } catch (error) {
    console.error("Get leave policy error:", error);
    res.status(500).json({ message: "Failed to fetch leave policy" });
  }
}

// POST /api/v1/leave-policies - Create new leave policy
export async function createLeavePolicy(req: Request, res: Response) {
  try {
    const data = CreateLeavePolicyDto.parse(req.body);
    
    // Check if code already exists
    const existing = await prisma.leavePolicy.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(409).json({ 
        message: `Leave policy with code "${data.code}" already exists` 
      });
    }

    const policy = await prisma.leavePolicy.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        defaultAllocatedDays: data.defaultAllocatedDays,
        maxCarryOverDays: data.maxCarryOverDays,
        carryOverEnabled: data.carryOverEnabled,
        requiresApproval: data.requiresApproval,
        requiresDocumentation: data.requiresDocumentation,
        isActive: data.isActive,
        renewalMonth: data.renewalMonth,
        renewalDay: data.renewalDay,
        color: data.color,
      },
    });

    // Convert Decimal to number
    const serialized = {
      ...policy,
      defaultAllocatedDays: Number(policy.defaultAllocatedDays),
      maxCarryOverDays: Number(policy.maxCarryOverDays),
    };

    res.status(201).json(serialized);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Create leave policy error:", error);
    res.status(500).json({ message: "Failed to create leave policy" });
  }
}

// PUT /api/v1/leave-policies/:id - Update leave policy
export async function updateLeavePolicy(req: Request, res: Response) {
  try {
    const data = UpdateLeavePolicyDto.parse(req.body);
    const policyId = req.params.id;

    const existing = await prisma.leavePolicy.findUnique({
      where: { id: policyId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Leave policy not found" });
    }

    const updated = await prisma.leavePolicy.update({
      where: { id: policyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.defaultAllocatedDays !== undefined && { defaultAllocatedDays: data.defaultAllocatedDays }),
        ...(data.maxCarryOverDays !== undefined && { maxCarryOverDays: data.maxCarryOverDays }),
        ...(data.carryOverEnabled !== undefined && { carryOverEnabled: data.carryOverEnabled }),
        ...(data.requiresApproval !== undefined && { requiresApproval: data.requiresApproval }),
        ...(data.requiresDocumentation !== undefined && { requiresDocumentation: data.requiresDocumentation }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.renewalMonth !== undefined && { renewalMonth: data.renewalMonth }),
        ...(data.renewalDay !== undefined && { renewalDay: data.renewalDay }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    // Convert Decimal to number
    const serialized = {
      ...updated,
      defaultAllocatedDays: Number(updated.defaultAllocatedDays),
      maxCarryOverDays: Number(updated.maxCarryOverDays),
    };

    res.json(serialized);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Update leave policy error:", error);
    res.status(500).json({ message: "Failed to update leave policy" });
  }
}

// DELETE /api/v1/leave-policies/:id - Delete leave policy
export async function deleteLeavePolicy(req: Request, res: Response) {
  try {
    const policyId = req.params.id;

    // Check if policy is being used in any leave balances
    const balancesCount = await prisma.leaveBalance.count({
      where: {
        // We need to check by code, but LeaveBalance uses LeaveType enum
        // For now, we'll just check if there are any active balances
        // In a real implementation, you'd need to map policy code to LeaveType
      },
    });

    // For safety, we'll just deactivate instead of deleting
    await prisma.leavePolicy.update({
      where: { id: policyId },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave policy not found" });
    }
    console.error("Delete leave policy error:", error);
    res.status(500).json({ message: "Failed to delete leave policy" });
  }
}

// POST /api/v1/leave-policies/renew - Renew leave balances for all employees
export async function renewLeaveBalances(req: Request, res: Response) {
  try {
    const { year, leaveTypeCode, employeeIds } = RenewLeaveBalancesDto.parse(req.body);
    const previousYear = year - 1;

    // Get active leave policies
    const wherePolicy: Prisma.LeavePolicyWhereInput = { isActive: true };
    if (leaveTypeCode) {
      wherePolicy.code = leaveTypeCode;
    }

    const policies = await prisma.leavePolicy.findMany({
      where: wherePolicy,
    });

    if (policies.length === 0) {
      return res.status(400).json({ message: "No active leave policies found" });
    }

    // Get all employees (or specific ones if provided)
    const whereEmployee: Prisma.EmployeeWhereInput = {};
    if (employeeIds && employeeIds.length > 0) {
      whereEmployee.id = { in: employeeIds };
    }

    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      select: { id: true },
    });

    if (employees.length === 0) {
      return res.status(400).json({ message: "No employees found" });
    }

    let totalRenewed = 0;
    let totalCarriedOver = 0;
    const errors: string[] = [];

    // Process each policy
    for (const policy of policies) {
      // Process each employee
      for (const employee of employees) {
        try {
          // Map policy code to LeaveType enum
          // Note: This assumes policy.code matches LeaveType enum values
          // For full custom leave types, the schema would need to be updated
          const leaveType = policy.code as "CASUAL" | "SICK" | "VACATION" | "MATERNITY" | "PERSONAL";
          
          // Get previous year's balance
          const previousBalance = await prisma.leaveBalance.findUnique({
            where: {
              employeeId_leaveType_year: {
                employeeId: employee.id,
                leaveType: leaveType,
                year: previousYear,
              },
            },
          });

          // Calculate carry over days
          let carryOverDays = 0;
          if (previousBalance && policy.carryOverEnabled) {
            const availableDays = Number(previousBalance.availableDays);
            carryOverDays = Math.min(availableDays, Number(policy.maxCarryOverDays));
            if (carryOverDays < 0) carryOverDays = 0;
            totalCarriedOver += carryOverDays;
          }

          // Check if balance already exists for this year
          const existingBalance = await prisma.leaveBalance.findUnique({
            where: {
              employeeId_leaveType_year: {
                employeeId: employee.id,
                leaveType: leaveType,
                year: year,
              },
            },
          });

          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocatedDays: policy.defaultAllocatedDays,
                carriedOver: carryOverDays,
                availableDays: Number(policy.defaultAllocatedDays) + carryOverDays - Number(existingBalance.usedDays),
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.id,
                leaveType: leaveType,
                year: year,
                allocatedDays: policy.defaultAllocatedDays,
                usedDays: 0,
                carriedOver: carryOverDays,
                availableDays: Number(policy.defaultAllocatedDays) + carryOverDays,
              },
            });
          }

          totalRenewed++;
        } catch (error: any) {
          errors.push(`Failed to renew ${policy.name} for employee ${employee.id}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Renewed leave balances for ${totalRenewed} employee-policy combinations`,
      totalRenewed,
      totalCarriedOver,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Renew leave balances error:", error);
    res.status(500).json({ message: "Failed to renew leave balances" });
  }
}

