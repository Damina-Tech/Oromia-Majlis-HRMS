import { Request, Response } from "express";
import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { CreateUserDto, UpdateUserDto, ListUsersQuery, UpdateSelfDto } from "./user.dto.js";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto.js";
import { paginate } from "../../lib/paginate.js";

const prisma = new PrismaClient();

type MulterRequest = Request & {
  file?: Express.Multer.File;
};

export async function listUsers(req: Request, res: Response) {
  try {
    const { search, roleId, status, page, pageSize } = ListUsersQuery.parse(req.query);

    // Get all users (without pagination first, we'll paginate after combining)
    // Note: We fetch all users because we need to combine with employees, then filter and paginate
    const userWhere: any = {};
    if (status) userWhere.status = status;
    if (roleId && roleId !== "all") {
      userWhere.userRoles = {
        some: {
          roleId,
        },
      };
    }

    const userItems = await prisma.user.findMany({
      where: userWhere,
      orderBy: [{ createdAt: "desc" }],
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Format user items - don't include passwordHash
    const formattedUserItems = userItems.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      employee: user.employee,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _isUserAccount: true, // Flag to indicate this is a real user account
    }));

    // Get employees without user accounts
    // Apply status filter to employees too
    const employeeWhere: any = {
      userId: null,
    };
    if (status) {
      employeeWhere.status = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    }

    const employeesWithoutUsers = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert employees to user-like format (for display)
    const employeeAsUsers = employeesWithoutUsers.map((emp) => ({
      id: `emp_${emp.id}`, // Prefix to avoid conflicts
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      status: emp.status === "ACTIVE" ? "ACTIVE" : "INACTIVE" as "ACTIVE" | "INACTIVE",
      avatarUrl: emp.avatarUrl ?? null,
      roles: [], // No roles since no user account
      employee: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        designation: emp.designation,
      },
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      _isUserAccount: false, // Flag to indicate this is NOT a real user account yet
    }));

    // Combine and apply filters
    let allItems = [...formattedUserItems, ...employeeAsUsers];

    // Apply search filter to combined list
    if (search) {
      const s = search.trim().toLowerCase();
      allItems = allItems.filter((item) =>
        item.firstName.toLowerCase().includes(s) ||
        item.lastName.toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s)
      );
    }

    // Apply role filter (only affects real users)
    if (roleId && roleId !== "all") {
      allItems = allItems.filter((item) => 
        item._isUserAccount && item.roles.some((r: any) => r.id === roleId)
      );
    }

    // Apply status filter
    if (status) {
      allItems = allItems.filter((item) => item.status === status);
    }

    // Sort by creation date
    allItems.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Apply pagination
    const total = allItems.length;
    const { skip, take } = paginate(page, pageSize);
    const paginatedItems = allItems.slice(skip, skip + take);

    res.json({ items: paginatedItems, total, page, pageSize });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    console.error("Failed to list users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            status: true,
            employmentType: true,
            joiningDate: true,
            avatarUrl: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all permissions from all roles
    const permissionsSet = new Set<string>();
    const permissionsWithDetails: Array<{ id: string; name: string; description?: string; module: string; action: string }> = [];
    const permissionsMap = new Map<string, { id: string; name: string; description?: string; module: string; action: string }>();

    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        if (!permissionsSet.has(rp.permission.name)) {
          permissionsSet.add(rp.permission.name);
          permissionsMap.set(rp.permission.name, {
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description || undefined,
            module: rp.permission.module,
            action: rp.permission.action,
          });
        }
      });
    });

    permissionsWithDetails.push(...Array.from(permissionsMap.values()));

    // Format response - don't include passwordHash
    const formatted = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      permissions: permissionsWithDetails,
      employee: user.employee,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(formatted);
  } catch (error) {
    console.error("Failed to get user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const dto = CreateUserDto.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check if employeeId is provided and exists
    if (dto.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      // Check if employee already has a user
      if (employee.userId) {
        return res.status(400).json({ message: "Employee already has a user account" });
      }
      // Check if employee email matches user email
      if (employee.email !== dto.email) {
        return res.status(400).json({ message: "Employee email must match user email" });
      }
    }

    // Verify all roles exist
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: dto.roleIds,
        },
      },
    });
    if (roles.length !== dto.roleIds.length) {
      return res.status(400).json({ message: "One or more roles not found" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: dto.status || "ACTIVE",
          userRoles: {
            create: dto.roleIds.map((roleId) => ({
              roleId,
            })),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              designation: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Link employee if provided
      if (dto.employeeId) {
        await tx.employee.update({
          where: { id: dto.employeeId },
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    // Format response - don't include passwordHash
    const formatted = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      employee: user.employee,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already in use" });
    }
    console.error("Failed to create user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateUserDto.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if new email already exists
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check employeeId if provided
    if (dto.employeeId !== undefined) {
      if (dto.employeeId === null) {
        // Unlink employee - update employee to remove userId
        if (existingUser.employee) {
          await prisma.employee.update({
            where: { id: existingUser.employee.id },
            data: { userId: null },
          });
        }
      } else {
        // Link to new employee
        const employee = await prisma.employee.findUnique({
          where: { id: dto.employeeId },
        });
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        // Check if employee already has a user
        if (employee.userId && employee.userId !== id) {
          return res.status(400).json({ message: "Employee already has a user account" });
        }
        // Check if employee email matches user email (or new email if provided)
        const userEmail = dto.email || existingUser.email;
        if (employee.email !== userEmail) {
          return res.status(400).json({ message: "Employee email must match user email" });
        }
      }
    }

    // Verify roles if provided
    if (dto.roleIds) {
      const roles = await prisma.role.findMany({
        where: {
          id: {
            in: dto.roleIds,
          },
        },
      });
      if (roles.length !== dto.roleIds.length) {
        return res.status(400).json({ message: "One or more roles not found" });
      }
    }

    // Hash password if provided
    let passwordHash = existingUser.passwordHash;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Update user in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Update user
      const updateData: any = {
        firstName: dto.firstName ?? existingUser.firstName,
        lastName: dto.lastName ?? existingUser.lastName,
        email: dto.email ?? existingUser.email,
        passwordHash,
        status: dto.status ?? existingUser.status,
      };

      if (dto.avatarUrl !== undefined) {
        updateData.avatarUrl = dto.avatarUrl;
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          employee: {
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

      if (updatedUser.employee) {
        const employeeProfileUpdates: any = {};
        if (dto.firstName !== undefined) employeeProfileUpdates.firstName = dto.firstName;
        if (dto.lastName !== undefined) employeeProfileUpdates.lastName = dto.lastName;
        if (dto.avatarUrl !== undefined) employeeProfileUpdates.avatarUrl = dto.avatarUrl;
        if (dto.status !== undefined) {
          employeeProfileUpdates.status = dto.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
        }

        if (Object.keys(employeeProfileUpdates).length > 0) {
          await tx.employee.update({
            where: { id: updatedUser.employee.id },
            data: employeeProfileUpdates,
          });
        }
      }

      // Update roles if provided
      if (dto.roleIds) {
        // Delete existing roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });
        // Create new roles
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
        // Reload user roles
        updatedUser.userRoles = await tx.userRole.findMany({
          where: { userId: id },
          include: {
            role: true,
          },
        });
      }

      // Update employee link if provided
      if (dto.employeeId !== undefined) {
        if (dto.employeeId === null) {
          // Already unlinked above, now disconnect in user relation
          await tx.user.update({
            where: { id },
            data: { employee: { disconnect: true } },
          });
        } else {
          // Update employee to link to user
          await tx.employee.update({
            where: { id: dto.employeeId },
            data: { userId: id },
          });
          // Reload user with updated employee relation
          const reloaded = await tx.user.findUnique({
            where: { id },
            include: {
              employee: {
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
          if (reloaded) {
            updatedUser.employee = reloaded.employee;
          }
        }
      }

      return updatedUser;
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            status: true,
            employmentType: true,
            joiningDate: true,
            avatarUrl: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!refreshedUser) {
      return res.status(404).json({ message: "User not found after update" });
    }

    const updatedFormatted = {
      id: refreshedUser.id,
      email: refreshedUser.email,
      firstName: refreshedUser.firstName,
      lastName: refreshedUser.lastName,
      avatarUrl: refreshedUser.avatarUrl,
      status: refreshedUser.status,
      roles: refreshedUser.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      employee: refreshedUser.employee,
      createdAt: refreshedUser.createdAt,
      updatedAt: refreshedUser.updatedAt,
    };

    res.json(updatedFormatted);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already in use" });
    }
    console.error("Failed to update user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user in transaction
    await prisma.$transaction(async (tx) => {
      // Unlink employee if exists
      if (user.employee) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: { userId: null },
        });
      }
      // Delete user (cascade will delete userRoles)
      await tx.user.delete({
        where: { id },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const permissionsMap = new Map<string, {
      id: string;
      name: string;
      description?: string;
      module: string;
      action: string;
    }>();

    user.userRoles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        const perm = rp.permission;
        if (!permissionsMap.has(perm.id)) {
          permissionsMap.set(perm.id, {
            id: perm.id,
            name: perm.name,
            description: perm.description ?? undefined,
            module: perm.module,
            action: perm.action,
          });
        }
      });
    });

    const formatted = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      permissions: Array.from(permissionsMap.values()),
      employee: user.employee,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(formatted);
  } catch (error) {
    console.error("Failed to get current user:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
}

export async function updateCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dto = UpdateSelfDto.parse(req.body);

    if (!dto.firstName && !dto.lastName && !dto.password && !dto.avatarUrl) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const data: any = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.avatarUrl) data.avatarUrl = dto.avatarUrl;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            status: true,
            employmentType: true,
            joiningDate: true,
            avatarUrl: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (dto.firstName || dto.lastName || dto.avatarUrl) {
      const employeeUpdate: any = {};
      if (dto.firstName) employeeUpdate.firstName = dto.firstName;
      if (dto.lastName) employeeUpdate.lastName = dto.lastName;
      if (dto.avatarUrl) employeeUpdate.avatarUrl = dto.avatarUrl;

      if (Object.keys(employeeUpdate).length > 0) {
        await prisma.employee.updateMany({
          where: { userId },
          data: employeeUpdate,
        });
      }
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            status: true,
            employmentType: true,
            joiningDate: true,
            avatarUrl: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!refreshedUser) {
      return res.status(404).json({ message: "User not found after update" });
    }

    res.json({
      id: refreshedUser.id,
      email: refreshedUser.email,
      firstName: refreshedUser.firstName,
      lastName: refreshedUser.lastName,
      avatarUrl: refreshedUser.avatarUrl,
      status: refreshedUser.status,
      roles: refreshedUser.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
      employee: refreshedUser.employee,
      createdAt: refreshedUser.createdAt,
      updatedAt: refreshedUser.updatedAt,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Failed to update current user:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function uploadUserAvatar(req: MulterRequest, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    await prisma.employee.updateMany({
      where: { userId },
      data: { avatarUrl },
    });

    res.json({ avatarUrl });
  } catch (error: any) {
    console.error("Failed to upload avatar:", error);
    res.status(500).json({ message: "Failed to upload avatar", error: error.message ?? error });
  }
}

export async function getRoles(req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Failed to get roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
}

export async function getPermissions(req: Request, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    res.json(permissions);
  } catch (error) {
    console.error("Failed to get permissions:", error);
    res.status(500).json({ message: "Failed to fetch permissions" });
  }
}

export async function getRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const formatted = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    res.json(formatted);
  } catch (error) {
    console.error("Failed to get role:", error);
    res.status(500).json({ message: "Failed to fetch role" });
  }
}

export async function createRole(req: Request, res: Response) {
  try {
    const dto = CreateRoleDto.parse(req.body);

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: dto.permissionIds,
        },
      },
    });
    if (permissions.length !== dto.permissionIds.length) {
      return res.status(400).json({ message: "One or more permissions not found" });
    }

    // Create role with permissions in transaction
    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description || null,
        },
      });

      // Create role-permission relationships
      await tx.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: newRole.id,
          permissionId,
        })),
      });

      // Reload role with permissions
      return await tx.role.findUnique({
        where: { id: newRole.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    const formatted = {
      id: role!.id,
      name: role!.name,
      description: role!.description,
      permissions: role!.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action,
      })),
      createdAt: role!.createdAt,
      updatedAt: role!.updatedAt,
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Role name already exists" });
    }
    console.error("Failed to create role:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
}

export async function updateRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = UpdateRoleDto.parse(req.body);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check if name is being changed and if new name already exists
    if (dto.name && dto.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: dto.name },
      });
      if (nameExists) {
        return res.status(400).json({ message: "Role name already exists" });
      }
    }

    // Verify permissions if provided
    if (dto.permissionIds) {
      const permissions = await prisma.permission.findMany({
        where: {
          id: {
            in: dto.permissionIds,
          },
        },
      });
      if (permissions.length !== dto.permissionIds.length) {
        return res.status(400).json({ message: "One or more permissions not found" });
      }
    }

    // Update role in transaction
    const role = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.name) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description || null;

      const updatedRole = await tx.role.update({
        where: { id },
        data: updateData,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Update permissions if provided
      if (dto.permissionIds) {
        // Delete existing role-permission relationships
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });
        // Create new role-permission relationships
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
        // Reload permissions
        updatedRole.permissions = await tx.rolePermission.findMany({
          where: { roleId: id },
          include: {
            permission: true,
          },
        });
      }

      return updatedRole;
    });

    const formatted = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
        action: rp.permission.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    res.json(formatted);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Role name already exists" });
    }
    console.error("Failed to update role:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
}

export async function deleteRole(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
    });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check if role is assigned to any users
    const userRoleCount = await prisma.userRole.count({
      where: { roleId: id },
    });
    if (userRoleCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. It is assigned to ${userRoleCount} user(s). Please remove the role from all users first.` 
      });
    }

    // Delete role (cascade will delete rolePermissions)
    await prisma.role.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete role:", error);
    res.status(500).json({ message: "Failed to delete role" });
  }
}

