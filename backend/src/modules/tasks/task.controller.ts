import { Request, Response } from "express";
import { PrismaClient, Prisma, NotificationModule, NotificationType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  CreateTaskDto,
  UpdateTaskDto,
  ListTasksQuery,
  AddCommentDto,
  AddTimeLogDto,
  BulkUpdateTasksDto,
} from "./task.dto.js";
import { paginate } from "../../utils/pagination.js";
import { NotificationService } from "../notifications/notification.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper function to check if Task model is available
function checkTaskModelAvailable(res: Response): boolean {
  if (!prisma.task) {
    res.status(500).json({
      message: "Task model not available. Please stop the server, run 'npx prisma generate', then restart the server.",
    });
    return false;
  }
  return true;
}

// Helper function to get current user ID
function getCurrentUserId(req: Request): string {
  return (req as any).user?.id;
}

// Helper function to get current user's employee ID
function getCurrentUserEmployeeId(req: Request): string | null {
  return (req as any).user?.employeeId || null;
}

// Helper function to get current user roles
function getCurrentUserRoles(req: Request): string[] {
  return (req as any).user?.roles || [];
}

/**
 * Create task
 */
export async function createTask(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const currentUserId = getCurrentUserId(req);
    const data = CreateTaskDto.parse(req.body);

    // Create task
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        project: data.project,
        priority: data.priority || "MEDIUM",
        status: data.status || "TODO",
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours,
        recurrenceType: data.recurrenceType || "NONE",
        recurrenceRule: data.recurrenceRule ? (data.recurrenceRule as Prisma.InputJsonValue) : Prisma.JsonNull,
        parentTaskId: data.parentTaskId,
        tags: data.tags || [],
        createdBy: currentUserId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                userId: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
            timeLogs: true,
          },
        },
      },
    });

    // Create assignments if provided
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      await Promise.all(
        data.assigneeIds.map((employeeId) =>
          prisma.taskAssignment.create({
            data: {
              taskId: task.id,
              employeeId,
              assignedBy: currentUserId,
            },
          })
        )
      );
    }

    // Create watchers if provided
    if (data.watcherIds && data.watcherIds.length > 0) {
      await Promise.all(
        data.watcherIds.map((userId) =>
          prisma.taskWatcher.create({
            data: {
              taskId: task.id,
              userId,
            },
          })
        )
      );
    }

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        type: "CREATED",
        actorId: currentUserId,
        details: {
          title: task.title,
        },
      },
    });

    // Reload task with all relations
    const fullTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                userId: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
            timeLogs: true,
          },
        },
      },
    });

    if (!fullTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    try {
      const assigneeUserIds = Array.from(
        new Set(
          (fullTask.assignments || [])
            .map((assignment) => assignment.employee?.userId)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (assigneeUserIds.length > 0) {
        await NotificationService.sendNotification({
          module: NotificationModule.TASK,
          type: NotificationType.INFO,
          title: `Task assigned: ${fullTask.title}`,
          message: `You have been assigned to "${fullTask.title}".`,
          resourceType: "TASK",
          resourceId: fullTask.id,
          dedupKey: `task-assigned-${fullTask.id}`,
          targets: {
            userIds: assigneeUserIds,
            excludeUserIds: currentUserId ? [currentUserId] : undefined,
          },
        });
      }

      const watcherUserIds = Array.from(
        new Set(
          (fullTask.watchers || [])
            .map((watcher) => watcher.user?.id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (watcherUserIds.length > 0) {
        await NotificationService.sendNotification({
          module: NotificationModule.TASK,
          type: NotificationType.INFO,
          title: `Task watch: ${fullTask.title}`,
          message: `You are now watching "${fullTask.title}".`,
          resourceType: "TASK",
          resourceId: fullTask.id,
          dedupKey: `task-watch-${fullTask.id}`,
          targets: {
            userIds: watcherUserIds,
            excludeUserIds: currentUserId ? [currentUserId] : undefined,
          },
        });
      }
    } catch (notifyError) {
      console.warn("Failed to send task notifications:", notifyError);
    }

    res.status(201).json(fullTask);
  } catch (err: any) {
    console.error("Create task error:", err);
    res.status(400).json({
      message: err.message || "Failed to create task",
    });
  }
}

/**
 * List tasks
 */
export async function listTasks(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const query = ListTasksQuery.parse(req.query);
    const currentUserId = getCurrentUserId(req);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const currentUserRoles = getCurrentUserRoles(req);
    const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
    const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
    const isManager = currentUserRoles.some((r) => r.toUpperCase() === "MANAGER");
    
    console.log("List tasks - User info:", {
      userId: currentUserId,
      employeeId: currentUserEmployeeId,
      roles: currentUserRoles,
      isAdmin,
      isHR,
      isManager,
    });

    // Build base filters (these apply to all users)
    const baseFilters: Prisma.TaskWhereInput = {};

    // Search filter
    if (query.search) {
      baseFilters.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { project: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (query.status) {
      baseFilters.status = query.status;
    }

    // Priority filter
    if (query.priority) {
      baseFilters.priority = query.priority;
    }

    // Project filter
    if (query.project) {
      baseFilters.project = query.project;
    }

    // Overdue filter - only apply if explicitly true
    if (query.overdueOnly === true) {
      baseFilters.dueDate = {
        lt: new Date(),
      };
      baseFilters.status = {
        not: "DONE",
      };
    }

    // Assignee filter (for admin/HR/Manager to filter by assignee)
    if (query.assigneeId && (isAdmin || isHR || isManager)) {
      baseFilters.assignments = {
        some: {
          employeeId: query.assigneeId,
        },
      };
    }

    // Watcher filter (for admin/HR/Manager)
    if (query.watcherId && (isAdmin || isHR || isManager)) {
      baseFilters.watchers = {
        some: {
          userId: query.watcherId,
        },
      };
    }

    // Creator filter (for admin/HR/Manager)
    if (query.createdById && (isAdmin || isHR || isManager)) {
      baseFilters.createdBy = query.createdById;
    }

    // Parent task filter
    if (query.parentTaskId !== undefined) {
      if (query.parentTaskId === null) {
        baseFilters.parentTaskId = null;
      } else {
        baseFilters.parentTaskId = query.parentTaskId;
      }
    }

    // Build access control conditions for non-admin users
    const accessConditions: Prisma.TaskWhereInput[] = [];
    
    if (!isAdmin && !isHR && !isManager) {
      if (currentUserEmployeeId) {
        // User can see tasks they're assigned to, watching, or created
        accessConditions.push(
          { assignments: { some: { employeeId: currentUserEmployeeId } } },
          { watchers: { some: { userId: currentUserId } } },
          { createdBy: currentUserId }
        );
      } else {
        // User without employeeId can only see tasks they're watching or created
        accessConditions.push(
          { watchers: { some: { userId: currentUserId } } },
          { createdBy: currentUserId }
        );
      }
    }

    // Unread filter (only for assigned tasks) - only apply if explicitly true
    if (query.unreadOnly === true && currentUserEmployeeId) {
      if (accessConditions.length > 0) {
        // For non-admin: replace assignments condition with unread filter
        accessConditions[0] = {
          assignments: {
            some: {
              employeeId: currentUserEmployeeId,
              isUnread: true,
            },
          },
        };
      } else {
        // For admin/HR/Manager: add unread filter to base filters
        baseFilters.assignments = {
          some: {
            employeeId: currentUserEmployeeId,
            isUnread: true,
          },
        };
      }
    }

    // Combine base filters with access control
    let where: Prisma.TaskWhereInput = {};
    
    if (accessConditions.length > 0) {
      // Non-admin users: combine base filters with access control using AND
      const andConditions: Prisma.TaskWhereInput[] = [{ OR: accessConditions }];
      
      // Only add baseFilters if it has any conditions
      const hasBaseFilters = Object.keys(baseFilters).length > 0;
      if (hasBaseFilters) {
        andConditions.unshift(baseFilters);
        where.AND = andConditions;
      } else {
        // No base filters, just use OR for access control
        where.OR = accessConditions;
      }
    } else {
      // Admin/HR/Manager: just use base filters (or empty object to get all tasks)
      if (Object.keys(baseFilters).length > 0) {
        where = baseFilters;
      } else {
        // No filters - return all tasks for admin/HR/Manager
        where = {};
      }
    }
    
    console.log("Task query where clause:", JSON.stringify(where, null, 2));
    console.log("Access conditions:", accessConditions.length);
    console.log("Base filters keys:", Object.keys(baseFilters));
    console.log("Is Admin/HR/Manager:", isAdmin || isHR || isManager);

    const { skip, take } = paginate(query.page, query.pageSize);
    
    console.log("Pagination:", { skip, take, page: query.page, pageSize: query.pageSize });

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeCode: true,
                },
              },
            },
          },
          watchers: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
              subtasks: true,
              timeLogs: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);
    
    console.log("Tasks found:", tasks.length, "Total:", total);

    // Add computed fields for each task
    const tasksWithComputed = tasks.map((task) => {
      const assignment = currentUserEmployeeId
        ? task.assignments.find((a) => a.employeeId === currentUserEmployeeId)
        : null;

      return {
        ...task,
        isUnread: assignment?.isUnread || false,
        isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE",
        remainingDays: task.dueDate
          ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });

    res.json({
      items: tasksWithComputed,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      totalPages: Math.ceil(total / (query.pageSize || 20)),
    });
  } catch (err: any) {
    console.error("List tasks error:", err);
    res.status(500).json({
      message: err.message || "Failed to list tasks",
    });
  }
}

/**
 * Get task by ID
 */
export async function getTask(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const currentUserRoles = getCurrentUserRoles(req);
    const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
    const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
    const isManager = currentUserRoles.some((r) => r.toUpperCase() === "MANAGER");

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        subtasks: {
          include: {
            _count: {
              select: {
                subtasks: true,
              },
            },
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        attachments: {
          include: {
            uploadedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            uploadedAt: "desc",
          },
        },
        activities: {
          include: {
            actor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
        dependents: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
        timeLogs: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
            loggedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
            timeLogs: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Access control
    if (!isAdmin && !isHR && !isManager) {
      const isAssigned = currentUserEmployeeId
        ? task.assignments.some((a) => a.employeeId === currentUserEmployeeId)
        : false;
      const isWatching = task.watchers.some((w) => w.userId === currentUserId);
      const isCreator = task.createdBy === currentUserId;

      if (!isAssigned && !isWatching && !isCreator) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Mark as read if user is assigned
    if (currentUserEmployeeId) {
      const assignment = task.assignments.find((a) => a.employeeId === currentUserEmployeeId);
      if (assignment && assignment.isUnread) {
        await prisma.taskAssignment.update({
          where: { id: assignment.id },
          data: {
            isUnread: false,
            lastReadAt: new Date(),
          },
        });
      }
    }

    // Add computed fields
    const taskWithComputed = {
      ...task,
      isUnread: currentUserEmployeeId
        ? task.assignments.find((a) => a.employeeId === currentUserEmployeeId)?.isUnread || false
        : false,
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE",
      remainingDays: task.dueDate
        ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };

    res.json(taskWithComputed);
  } catch (err: any) {
    console.error("Get task error:", err);
    res.status(500).json({
      message: err.message || "Failed to get task",
    });
  }
}

/**
 * Update task
 */
export async function updateTask(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const data = UpdateTaskDto.parse(req.body);

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Prepare update data
    const updateData: Prisma.TaskUpdateInput = {
      title: data.title,
      description: data.description,
      project: data.project,
      priority: data.priority,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours,
      ...(data.actualHours !== undefined && { actualHours: data.actualHours }),
      recurrenceType: data.recurrenceType,
      recurrenceRule: data.recurrenceRule !== undefined ? (data.recurrenceRule ? (data.recurrenceRule as Prisma.InputJsonValue) : Prisma.JsonNull) : undefined,
      ...(data.parentTaskId !== undefined && { parentTaskId: data.parentTaskId }),
      tags: data.tags,
      ...(currentUserId && { updatedBy: currentUserId }),
    };

    // Handle status change
    if (data.status && data.status !== existingTask.status) {
      if (data.status === "DONE") {
        updateData.completedAt = new Date();
        if (currentUserId) {
          (updateData as any).completedBy = currentUserId;
        }
      } else if (existingTask.status === "DONE") {
        updateData.completedAt = null;
        (updateData as any).completedBy = null;
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                userId: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
            timeLogs: true,
          },
        },
      },
    });

    // Update assignments if provided
    if (data.assigneeIds !== undefined) {
      // Remove existing assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // Create new assignments
      if (data.assigneeIds.length > 0) {
        await Promise.all(
          data.assigneeIds.map((employeeId) =>
            prisma.taskAssignment.create({
              data: {
                taskId: id,
                employeeId,
                assignedBy: currentUserId,
              },
            })
          )
        );
      }
    }

    // Update watchers if provided
    if (data.watcherIds !== undefined) {
      // Remove existing watchers
      await prisma.taskWatcher.deleteMany({
        where: { taskId: id },
      });

      // Create new watchers
      if (data.watcherIds.length > 0) {
        await Promise.all(
          data.watcherIds.map((userId) =>
            prisma.taskWatcher.create({
              data: {
                taskId: id,
                userId,
              },
            })
          )
        );
      }
    }

    // Log activity
    const activityDetails: any = {};
    if (data.status && data.status !== existingTask.status) {
      activityDetails.oldStatus = existingTask.status;
      activityDetails.newStatus = data.status;
    }
    if (data.priority && data.priority !== existingTask.priority) {
      activityDetails.oldPriority = existingTask.priority;
      activityDetails.newPriority = data.priority;
    }

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        type: data.status && data.status !== existingTask.status ? "STATUS_CHANGED" : "UPDATED",
        actorId: currentUserId,
        details: activityDetails,
      },
    });

    // Reload task with all relations
    const fullTask = await prisma.task.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true,
            timeLogs: true,
          },
        },
      },
    });

    try {
      const statusChanged =
        data.status && data.status !== existingTask.status
          ? true
          : false;

      const assignmentUserIds = Array.from(
        new Set(
          (fullTask?.assignments || [])
            .map((assignment) => (assignment.employee as any)?.user?.id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const watcherUserIds = Array.from(
        new Set(
          (fullTask?.watchers || [])
            .map((watcher) => watcher.user?.id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (statusChanged && assignmentUserIds.length + watcherUserIds.length > 0) {
        const recipients = Array.from(
          new Set([...assignmentUserIds, ...watcherUserIds])
        );

        await NotificationService.sendNotification({
          module: NotificationModule.TASK,
          type:
            data.status === "DONE"
              ? NotificationType.SUCCESS
              : NotificationType.INFO,
          title: `Task status updated: ${fullTask?.title}`,
          message: `Status changed to ${data.status}.`,
          resourceType: "TASK",
          resourceId: fullTask?.id,
          dedupKey: `task-status-${fullTask?.id}`,
          targets: {
            userIds: recipients,
            excludeUserIds: currentUserId ? [currentUserId] : undefined,
          },
        });
      }

      if (Array.isArray(data.assigneeIds)) {
        const previousEmployeeIds = new Set(
          (existingTask.assignments || []).map((assignment) => assignment.employeeId)
        );
        const addedEmployeeIds = data.assigneeIds.filter(
          (employeeId) => !previousEmployeeIds.has(employeeId)
        );

        if (addedEmployeeIds.length > 0) {
          const employees = await prisma.employee.findMany({
            where: {
              id: { in: addedEmployeeIds },
              userId: { not: null },
            },
            select: { userId: true },
          });
          const userIds = employees
            .map((emp) => emp.userId)
            .filter((id): id is string => Boolean(id));

          if (userIds.length > 0) {
            await NotificationService.sendNotification({
              module: NotificationModule.TASK,
              type: NotificationType.INFO,
              title: `Task assigned: ${fullTask?.title}`,
              message: `You have been assigned to "${fullTask?.title}".`,
              resourceType: "TASK",
              resourceId: fullTask?.id,
              dedupKey: `task-assigned-${fullTask?.id}`,
              targets: {
                userIds,
                excludeUserIds: currentUserId ? [currentUserId] : undefined,
              },
            });
          }
        }
      }
    } catch (notifyError) {
      console.warn("Failed to send task update notifications:", notifyError);
    }

    res.json(fullTask);
  } catch (err: any) {
    console.error("Update task error:", err);
    res.status(400).json({
      message: err.message || "Failed to update task",
    });
  }
}

/**
 * Delete task
 */
export async function deleteTask(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err: any) {
    console.error("Delete task error:", err);
    res.status(400).json({
      message: err.message || "Failed to delete task",
    });
  }
}

/**
 * Add comment to task
 */
export async function addComment(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const data = AddCommentDto.parse(req.body);

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        content: data.content,
        mentions: data.mentions || [],
        createdBy: currentUserId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        type: "COMMENTED",
        actorId: currentUserId,
        details: {
          commentId: comment.id,
        },
      },
    });

    try {
      const task = await prisma.task.findUnique({
        where: { id },
        select: { title: true },
      });

      if (data.mentions && data.mentions.length > 0) {
        await NotificationService.sendNotification({
          module: NotificationModule.TASK,
          type: NotificationType.INFO,
          title: `You were mentioned in ${task?.title ?? "a task"}`,
          message: data.content.slice(0, 160),
          resourceType: "TASK",
          resourceId: id,
          dedupKey: `task-comment-mentions-${id}`,
          targets: {
            userIds: data.mentions,
            excludeUserIds: currentUserId ? [currentUserId] : undefined,
          },
        });
      }
    } catch (notifyError) {
      console.warn("Failed to send task comment notification:", notifyError);
    }

    res.status(201).json(comment);
  } catch (err: any) {
    console.error("Add comment error:", err);
    res.status(400).json({
      message: err.message || "Failed to add comment",
    });
  }
}

/**
 * Add time log to task
 */
export async function addTimeLog(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const data = AddTimeLogDto.parse(req.body);

    if (!currentUserEmployeeId) {
      return res.status(400).json({
        message: "Employee ID required to log time",
      });
    }

    const timeLog = await prisma.taskTimeLog.create({
      data: {
        taskId: id,
        employeeId: currentUserEmployeeId,
        date: new Date(data.date),
        hours: data.hours,
        description: data.description,
        loggedBy: currentUserId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        loggedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update task's actual hours
    const task = await prisma.task.findUnique({
      where: { id },
      select: { actualHours: true },
    });

    if (task) {
      await prisma.task.update({
        where: { id },
        data: {
          actualHours: new Prisma.Decimal((task.actualHours ? parseFloat(task.actualHours.toString()) : 0) + data.hours),
        },
      });
    }

    res.status(201).json(timeLog);
  } catch (err: any) {
    console.error("Add time log error:", err);
    res.status(400).json({
      message: err.message || "Failed to add time log",
    });
  }
}

/**
 * Bulk update tasks
 */
export async function bulkUpdateTasks(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const currentUserId = getCurrentUserId(req);
    const data = BulkUpdateTasksDto.parse(req.body);

    const results = await Promise.all(
      data.taskIds.map(async (taskId) => {
        const updateData: any = {};
        if (currentUserId) {
          updateData.updatedBy = currentUserId;
        }

        if (data.status) updateData.status = data.status;
        if (data.priority) updateData.priority = data.priority;
        if (data.assigneeIds !== undefined) {
          // Remove existing assignments
          await prisma.taskAssignment.deleteMany({
            where: { taskId },
          });

          // Create new assignments
          if (data.assigneeIds.length > 0) {
            await Promise.all(
              data.assigneeIds.map((employeeId) =>
                prisma.taskAssignment.create({
                  data: {
                    taskId,
                    employeeId,
                    assignedBy: currentUserId,
                  },
                })
              )
            );
          }
        }

        return prisma.task.update({
          where: { id: taskId },
          data: updateData,
        });
      })
    );

    res.json({ updated: results.length, tasks: results });
  } catch (err: any) {
    console.error("Bulk update tasks error:", err);
    res.status(400).json({
      message: err.message || "Failed to bulk update tasks",
    });
  }
}

/**
 * Get task statistics
 */
export async function getTaskStats(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const currentUserId = getCurrentUserId(req);
    const currentUserEmployeeId = getCurrentUserEmployeeId(req);
    const currentUserRoles = getCurrentUserRoles(req);
    const isAdmin = currentUserRoles.some((r) => r.toUpperCase() === "ADMIN");
    const isHR = currentUserRoles.some((r) => r.toUpperCase() === "HR");
    const isManager = currentUserRoles.some((r) => r.toUpperCase() === "MANAGER");

    const where: Prisma.TaskWhereInput = {};

    // Access control: Non-admin users only see their own tasks
    if (!isAdmin && !isHR && !isManager) {
      if (currentUserEmployeeId) {
        where.OR = [
          { assignments: { some: { employeeId: currentUserEmployeeId } } },
          { watchers: { some: { userId: currentUserId } } },
          { createdBy: currentUserId },
        ];
      } else {
        where.OR = [
          { watchers: { some: { userId: currentUserId } } },
          { createdBy: currentUserId },
        ];
      }
    }

    const [total, completed, overdue, byStatus, byPriority, totalHours, byUser] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({
        where: {
          ...where,
          status: "DONE",
        },
      }),
      prisma.task.count({
        where: {
          ...where,
          dueDate: {
            lt: new Date(),
          },
          status: {
            not: "DONE",
          },
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where,
        _count: true,
      }),
      prisma.taskTimeLog.aggregate({
        _sum: {
          hours: true,
        },
      }),
      // Get task IDs that match the where clause
      prisma.task.findMany({
        where,
        select: { id: true },
      }).then((tasks) => {
        const taskIds = tasks.map((t) => t.id);
        if (taskIds.length === 0) return [];
        return prisma.taskAssignment.groupBy({
          by: ["employeeId"],
          where: {
            taskId: { in: taskIds },
          },
          _count: true,
        });
      }),
    ]);

    // Transform byStatus array to Record
    const tasksByStatus: Record<string, number> = {};
    byStatus.forEach((s) => {
      tasksByStatus[s.status] = s._count;
    });

    // Transform byPriority array to Record
    const tasksByPriority: Record<string, number> = {};
    byPriority.forEach((p) => {
      tasksByPriority[p.priority] = p._count;
    });

    res.json({
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      tasksByStatus,
      tasksByPriority,
      totalTimeSpent: totalHours._sum.hours ? Number(totalHours._sum.hours) : 0,
      tasksByUser: await Promise.all(
        byUser.map(async (u) => {
          const employee = await prisma.employee.findUnique({
            where: { id: u.employeeId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          });
          return {
            employeeId: u.employeeId,
            employee,
            taskCount: u._count,
          };
        })
      ),
    });
  } catch (err: any) {
    console.error("Get task stats error:", err);
    res.status(500).json({
      message: err.message || "Failed to get task stats",
    });
  }
}

/**
 * Upload attachment
 */
export async function uploadAttachment(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id } = req.params;
    const currentUserId = getCurrentUserId(req);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/tasks/${req.file.filename}`;
    const filePath = path.join(__dirname, "../../../uploads/tasks", req.file.filename);

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        fileUrl,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: currentUserId,
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        type: "ATTACHMENT_ADDED",
        actorId: currentUserId,
        details: {
          attachmentId: attachment.id,
          fileName: attachment.fileName,
        },
      },
    });

    res.status(201).json(attachment);
  } catch (err: any) {
    console.error("Upload attachment error:", err);
    res.status(400).json({
      message: err.message || "Failed to upload attachment",
    });
  }
}

/**
 * Download attachment
 */
export async function downloadAttachment(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id, attachmentId } = req.params;

    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: id,
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Resolve file path
    const fileName = attachment.fileUrl.split("/").pop() || attachment.fileName;
    const filePath = path.join(__dirname, "../../../uploads/tasks", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, attachment.fileName);
  } catch (err: any) {
    console.error("Download attachment error:", err);
    res.status(500).json({
      message: err.message || "Failed to download attachment",
    });
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(req: Request, res: Response) {
  try {
    if (!checkTaskModelAvailable(res)) return;

    const { id, attachmentId } = req.params;
    const currentUserId = getCurrentUserId(req);

    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: id,
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Delete file from filesystem
    const fileName = attachment.fileUrl.split("/").pop() || attachment.fileName;
    const filePath = path.join(__dirname, "../../../uploads/tasks", fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId: id,
        type: "UPDATED",
        actorId: currentUserId,
        details: {
          action: "attachment_deleted",
          attachmentId: attachment.id,
          fileName: attachment.fileName,
        },
      },
    });

    res.status(204).send();
  } catch (err: any) {
    console.error("Delete attachment error:", err);
    res.status(400).json({
      message: err.message || "Failed to delete attachment",
    });
  }
}

