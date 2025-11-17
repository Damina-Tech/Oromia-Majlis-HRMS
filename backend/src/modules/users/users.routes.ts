import { Router } from "express";
import { Request, Response } from "express";
import { AppDataSource } from "../../db/data-source.js";
import { User } from "../../entities/User.js";
import { UserRole } from "../../entities/UserRole.js";
import { Role } from "../../entities/Role.js";

const router = Router();

// GET /api/v1/users - List users
router.get("/", async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const users = await repo.find({
      relations: {
        userRoles: { role: true },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/v1/users/:id - Get specific user
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({
      where: { id: req.params.id },
      relations: {
        userRoles: { role: true },
      },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
