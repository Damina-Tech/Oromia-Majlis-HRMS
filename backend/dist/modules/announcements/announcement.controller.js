import { PrismaClient } from "@prisma/client";
import { CreateAnnouncementDto, UpdateAnnouncementDto, ListAnnouncementsQuery, AcknowledgeAnnouncementDto, ListReadsQuery, } from "./announcement.dto.js";
import { paginate } from "../../utils/pagination.js";
import { enqueueAnnouncementDelivery } from "./delivery-queue.js";
const prisma = new PrismaClient();
function getCurrentUserId(req) {
    return req.user?.id;
}
/**
 * Create announcement
 */
export async function createAnnouncement(req, res) {
    try {
        const currentUserId = getCurrentUserId(req);
        const data = CreateAnnouncementDto.parse(req.body);
        // Determine status based on publishAt and explicit publish flag
        // If publish flag is true, publish immediately (set publishAt to now if not provided)
        // If publishAt is provided and in the future, schedule it
        // If publishAt is provided and in the past/now, publish immediately
        // If no publishAt and publish is false, keep as DRAFT
        let status = "DRAFT";
        let publishAtDate = data.publishAt ? new Date(data.publishAt) : null;
        const now = new Date();
        if (data.publish === true) {
            // Explicit publish: set publishAt to now if not provided, status to PUBLISHED
            if (!publishAtDate || publishAtDate > now) {
                publishAtDate = now;
            }
            status = "PUBLISHED";
        }
        else if (data.publishAt && publishAtDate) {
            // Scheduled publish: determine status based on date
            if (publishAtDate <= now) {
                status = "PUBLISHED";
            }
            else {
                status = "SCHEDULED";
            }
        }
        // Otherwise, keep as DRAFT (user clicked "Save Draft")
        // Create announcement
        const announcement = await prisma.announcement.create({
            data: {
                title: data.title,
                body: data.body,
                type: data.type,
                urgency: data.urgency || "NORMAL",
                publishAt: publishAtDate,
                expireAt: data.expireAt ? new Date(data.expireAt) : null,
                status,
                target: data.target,
                channels: data.channels,
                requiresAck: data.requiresAck || false,
                requiresRSVP: data.requiresRSVP || false,
                createdBy: currentUserId,
                publishedAt: status === "PUBLISHED" ? new Date() : null,
                attachments: data.attachmentIds
                    ? {
                        connect: data.attachmentIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                attachments: true,
            },
        });
        // If published immediately, enqueue deliveries
        if (status === "PUBLISHED") {
            await enqueueAnnouncementDelivery(announcement.id);
        }
        return res.status(201).json(announcement);
    }
    catch (error) {
        console.error("Create announcement error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to create announcement" });
    }
}
/**
 * List announcements
 */
export async function listAnnouncements(req, res) {
    try {
        const query = ListAnnouncementsQuery.parse(req.query);
        const currentUserId = getCurrentUserId(req);
        // Get current user's employee and roles for targeting
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: {
                employee: {
                    select: {
                        id: true,
                        departmentId: true,
                    },
                },
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        // Check if user is admin or HR (has manage permissions)
        const isAdmin = currentUser?.userRoles.some((ur) => ur.role.name.toUpperCase() === "ADMIN") || false;
        const isHR = currentUser?.userRoles.some((ur) => ur.role.name.toUpperCase() === "HR") || false;
        const isAdminOrHR = isAdmin || isHR;
        // Base where clause - admins/HR can see all, regular users only published
        const where = {
            status: isAdminOrHR
                ? { in: ["DRAFT", "SCHEDULED", "PUBLISHED"] } // Admins/HR can see drafts and scheduled
                : { in: ["SCHEDULED", "PUBLISHED"] }, // Regular users only see published
        };
        // Admin and HR can see all announcements (including drafts and scheduled)
        // Regular users can only see published announcements that are targeted to them
        if (!isAdminOrHR) {
            const now = new Date();
            where.AND = [
                { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
                { OR: [{ expireAt: null }, { expireAt: { gte: now } }] },
            ];
            // For non-admin users, we'll fetch all published announcements and filter client-side
            // This is more reliable than complex JSON path queries
            // The actual target filtering happens in the client-side filter below
        }
        // Filters
        if (query.status) {
            where.status = query.status;
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.urgency) {
            where.urgency = query.urgency;
        }
        if (query.search) {
            where.OR = [
                ...(where.OR || []),
                { title: { contains: query.search, mode: "insensitive" } },
                { body: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) {
                where.createdAt.gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                where.createdAt.lte = new Date(query.dateTo);
            }
        }
        // For non-admin users, we need to fetch more records to account for client-side filtering
        // For admin users, we can paginate directly in the database
        const { skip, take } = paginate(query.page, query.pageSize);
        const fetchLimit = isAdminOrHR ? take : query.pageSize * 10; // Fetch more for filtering
        const fetchSkip = isAdminOrHR ? skip : 0; // Start from beginning for filtering
        // Get announcements
        const announcements = await prisma.announcement.findMany({
            where,
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                attachments: {
                    select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        contentType: true,
                        fileSize: true,
                    },
                },
                _count: {
                    select: {
                        reads: true,
                        deliveries: true,
                    },
                },
            },
            orderBy: [
                { urgency: "desc" },
                { publishAt: "desc" },
                { createdAt: "desc" },
            ],
            skip: fetchSkip,
            take: fetchLimit,
        });
        // Filter announcements by target (client-side for now)
        // In production, use proper JSON querying with database indexes
        // Admin and HR can see all announcements regardless of target
        const filteredAnnouncements = isAdminOrHR
            ? announcements // Admins/HR see all
            : announcements.filter((announcement) => {
                const target = announcement.target;
                // If target is "all", show to everyone
                if (target?.type === "all") {
                    return true;
                }
                // If target is not properly set, don't show it to regular users
                if (!target || !target.type) {
                    return false;
                }
                // Apply search filter if provided (since we may have OR conditions)
                if (query.search) {
                    const searchLower = query.search.toLowerCase();
                    const matchesSearch = announcement.title.toLowerCase().includes(searchLower) ||
                        announcement.body.toLowerCase().includes(searchLower);
                    if (!matchesSearch) {
                        return false;
                    }
                }
                // Check if user matches target - ensure we have the necessary user data
                if (target.type === "department") {
                    if (!currentUser?.employee?.departmentId) {
                        return false;
                    }
                    // Check if department ID is in target ids array
                    const targetIds = target.ids || [];
                    return targetIds.includes(currentUser.employee.departmentId);
                }
                if (target.type === "role") {
                    if (!currentUser?.userRoles || currentUser.userRoles.length === 0) {
                        return false;
                    }
                    const userRoleIds = currentUser.userRoles.map((ur) => ur.role.id);
                    const targetIds = target.ids || [];
                    // Check if any of the user's roles match the target role IDs
                    return targetIds.some((roleId) => userRoleIds.includes(roleId));
                }
                if (target.type === "employees") {
                    if (!currentUser?.employee?.id) {
                        return false;
                    }
                    const targetIds = target.ids || [];
                    return targetIds.includes(currentUser.employee.id);
                }
                // If target type is not recognized, don't show it
                return false;
            });
        // Get read status for current user (after filtering)
        const announcementIds = filteredAnnouncements.map((a) => a.id);
        const reads = await prisma.announcementRead.findMany({
            where: {
                announcementId: { in: announcementIds },
                userId: currentUserId,
            },
        });
        const readMap = new Map(reads.map((r) => [r.announcementId, r]));
        // Add read status to announcements
        const announcementsWithReadStatus = filteredAnnouncements.map((announcement) => ({
            ...announcement,
            isRead: readMap.has(announcement.id),
            readAt: readMap.get(announcement.id)?.readAt,
            acknowledged: readMap.get(announcement.id)?.acknowledged || false,
        }));
        // Apply pagination to filtered results
        // For admin users, pagination was already applied in the database query
        // For non-admin users, we need to re-paginate after filtering
        let paginatedItems;
        let totalCount;
        if (isAdminOrHR) {
            // Admin users: already paginated, but we need total count
            paginatedItems = announcementsWithReadStatus;
            // Get total count for admin (all matching announcements)
            totalCount = await prisma.announcement.count({ where });
        }
        else {
            // Non-admin users: re-paginate after filtering
            const { skip: pageSkip, take: pageTake } = paginate(query.page, query.pageSize);
            paginatedItems = announcementsWithReadStatus.slice(pageSkip, pageSkip + pageTake);
            totalCount = filteredAnnouncements.length;
        }
        return res.status(200).json({
            items: paginatedItems,
            total: totalCount,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(totalCount / query.pageSize),
        });
    }
    catch (error) {
        console.error("List announcements error:", error);
        return res.status(500).json({ message: "Failed to list announcements" });
    }
}
/**
 * Get announcement by ID
 */
export async function getAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = getCurrentUserId(req);
        const announcement = await prisma.announcement.findUnique({
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
                attachments: {
                    select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        contentType: true,
                        fileSize: true,
                        uploadedAt: true,
                    },
                },
                _count: {
                    select: {
                        reads: true,
                        deliveries: true,
                    },
                },
            },
        });
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        // Get read status for current user (if exists)
        let read = null;
        try {
            read = await prisma.announcementRead.findUnique({
                where: {
                    announcementId_userId: {
                        announcementId: id,
                        userId: currentUserId,
                    },
                },
            });
        }
        catch (error) {
            // Read record doesn't exist yet, that's fine
        }
        return res.status(200).json({
            ...announcement,
            isRead: !!read,
            readAt: read?.readAt,
            acknowledged: read?.acknowledged || false,
        });
    }
    catch (error) {
        console.error("Get announcement error:", error);
        return res.status(500).json({ message: "Failed to get announcement" });
    }
}
/**
 * Update announcement
 */
export async function updateAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = getCurrentUserId(req);
        const data = UpdateAnnouncementDto.parse(req.body);
        const existing = await prisma.announcement.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        // Don't allow editing published announcements (unless admin)
        if (existing.status === "PUBLISHED" && data.status !== "EXPIRED" && data.status !== "CANCELLED") {
            return res.status(400).json({ message: "Cannot edit published announcement" });
        }
        // Determine status
        let status = existing.status;
        let publishAtDate = data.publishAt !== undefined
            ? (data.publishAt ? new Date(data.publishAt) : null)
            : existing.publishAt;
        const now = new Date();
        if (data.status) {
            // Explicit status override
            status = data.status;
        }
        else if (data.publish === true) {
            // Explicit publish flag: publish immediately
            if (!publishAtDate || publishAtDate > now) {
                publishAtDate = now;
            }
            status = "PUBLISHED";
        }
        else if (data.publishAt !== undefined) {
            // publishAt changed: determine status based on date
            if (publishAtDate && publishAtDate <= now) {
                status = "PUBLISHED";
            }
            else if (publishAtDate) {
                status = "SCHEDULED";
            }
            else {
                // publishAt removed: revert to DRAFT
                status = "DRAFT";
            }
        }
        const updateData = {
            ...(data.title && { title: data.title }),
            ...(data.body && { body: data.body }),
            ...(data.type && { type: data.type }),
            ...(data.urgency && { urgency: data.urgency }),
            ...(data.publishAt !== undefined || data.publish === true
                ? { publishAt: publishAtDate }
                : {}),
            ...(data.expireAt !== undefined && { expireAt: data.expireAt ? new Date(data.expireAt) : null }),
            ...(data.target && { target: data.target }),
            ...(data.channels && { channels: data.channels }),
            ...(data.requiresAck !== undefined && { requiresAck: data.requiresAck }),
            ...(data.requiresRSVP !== undefined && { requiresRSVP: data.requiresRSVP }),
            status,
            updatedBy: currentUserId,
            ...(status === "PUBLISHED" && !existing.publishedAt && { publishedAt: new Date() }),
        };
        const announcement = await prisma.announcement.update({
            where: { id },
            data: updateData,
            include: {
                updatedByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                attachments: true,
            },
        });
        // If just published, enqueue deliveries
        if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
            await enqueueAnnouncementDelivery(announcement.id);
        }
        return res.status(200).json(announcement);
    }
    catch (error) {
        console.error("Update announcement error:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        return res.status(500).json({ message: "Failed to update announcement" });
    }
}
/**
 * Delete announcement
 */
export async function deleteAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const existing = await prisma.announcement.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        if (existing.status === "PUBLISHED") {
            // Cancel instead of delete
            await prisma.announcement.update({
                where: { id },
                data: { status: "CANCELLED" },
            });
            return res.status(200).json({ message: "Announcement cancelled" });
        }
        await prisma.announcement.delete({
            where: { id },
        });
        return res.status(200).json({ message: "Announcement deleted" });
    }
    catch (error) {
        console.error("Delete announcement error:", error);
        return res.status(500).json({ message: "Failed to delete announcement" });
    }
}
/**
 * Publish announcement manually
 */
export async function publishAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        if (announcement.status === "PUBLISHED") {
            return res.status(400).json({ message: "Announcement is already published" });
        }
        const updated = await prisma.announcement.update({
            where: { id },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
                publishAt: null, // Clear scheduled time
            },
        });
        // Enqueue deliveries
        await enqueueAnnouncementDelivery(updated.id);
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error("Publish announcement error:", error);
        return res.status(500).json({ message: "Failed to publish announcement" });
    }
}
/**
 * Acknowledge/Read announcement
 */
export async function acknowledgeAnnouncement(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = getCurrentUserId(req);
        const data = AcknowledgeAnnouncementDto.parse(req.body);
        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        // Check if read record already exists
        const existingRead = await prisma.announcementRead.findUnique({
            where: {
                announcementId_userId: {
                    announcementId: id,
                    userId: currentUserId,
                },
            },
        });
        // Upsert read record
        const read = await prisma.announcementRead.upsert({
            where: {
                announcementId_userId: {
                    announcementId: id,
                    userId: currentUserId,
                },
            },
            create: {
                announcementId: id,
                userId: currentUserId,
                acknowledged: data.acknowledged || false,
                deviceInfo: data.deviceInfo,
            },
            update: {
                readAt: new Date(),
                acknowledged: data.acknowledged !== undefined ? data.acknowledged : (existingRead?.acknowledged || false),
                deviceInfo: data.deviceInfo,
            },
        });
        return res.status(200).json(read);
    }
    catch (error) {
        console.error("Acknowledge announcement error:", error);
        return res.status(500).json({ message: "Failed to acknowledge announcement" });
    }
}
/**
 * List reads for an announcement (admin only)
 */
export async function listAnnouncementReads(req, res) {
    try {
        const { id } = req.params;
        const query = ListReadsQuery.parse(req.query);
        const where = {
            announcementId: id,
        };
        if (query.acknowledgedOnly) {
            where.acknowledged = true;
        }
        const { skip, take } = paginate(query.page, query.pageSize);
        const [reads, total] = await Promise.all([
            prisma.announcementRead.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    readAt: "desc",
                },
                skip,
                take,
            }),
            prisma.announcementRead.count({ where }),
        ]);
        return res.status(200).json({
            items: reads,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        });
    }
    catch (error) {
        console.error("List announcement reads error:", error);
        return res.status(500).json({ message: "Failed to list reads" });
    }
}
/**
 * Get announcement statistics (admin only)
 */
export async function getAnnouncementStats(req, res) {
    try {
        const { id } = req.params;
        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        reads: true,
                        deliveries: true,
                    },
                },
            },
        });
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }
        // Get delivery stats
        const deliveryStats = await prisma.announcementDelivery.groupBy({
            by: ["channel", "status"],
            where: {
                announcementId: id,
            },
            _count: true,
        });
        // Get read stats
        const acknowledgedCount = await prisma.announcementRead.count({
            where: {
                announcementId: id,
                acknowledged: true,
            },
        });
        return res.status(200).json({
            announcement: {
                id: announcement.id,
                title: announcement.title,
                status: announcement.status,
                publishedAt: announcement.publishedAt,
            },
            reads: {
                total: announcement._count.reads,
                acknowledged: acknowledgedCount,
                unread: 0, // Calculate based on target
            },
            deliveries: {
                total: announcement._count.deliveries,
                byChannel: deliveryStats.reduce((acc, stat) => {
                    if (!acc[stat.channel]) {
                        acc[stat.channel] = {};
                    }
                    acc[stat.channel][stat.status] = stat._count;
                    return acc;
                }, {}),
            },
        });
    }
    catch (error) {
        console.error("Get announcement stats error:", error);
        return res.status(500).json({ message: "Failed to get announcement stats" });
    }
}
//# sourceMappingURL=announcement.controller.js.map