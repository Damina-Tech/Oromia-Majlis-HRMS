import { Router } from "express";
import { verifyAnyCertificate } from "./certificate-verify.controller.js";

const router = Router();

// Public — no auth
router.get("/verify/:code", verifyAnyCertificate);

export default router;
