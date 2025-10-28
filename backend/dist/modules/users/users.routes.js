import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();
// GET /api/v1/users - List users
router.get("/", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                userRoles: {
                    include: {
                        role: true
                    }
                }
            }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});
// GET /api/v1/users/:id - Get specific user
router.get("/:id", async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                userRoles: {
                    include: {
                        role: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
});
export default router;
//# sourceMappingURL=users.routes.js.map