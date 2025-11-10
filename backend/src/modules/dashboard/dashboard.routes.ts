import { Router } from "express";
import { getDashboardStats } from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get dashboard stats
router.get("/stats", getDashboardStats);

export default router;

