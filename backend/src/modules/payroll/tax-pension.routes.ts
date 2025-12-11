import { Router } from "express";
import * as taxPensionController from "./tax-pension.controller.js";
import { requireAuth, hasPermission } from "../../middleware/auth.js";

const router = Router();

// All routes require authentication and payroll.process permission
router.use(requireAuth, hasPermission("payroll.process"));

// Tax rate routes
router.post("/tax", taxPensionController.createTaxRate);
router.get("/tax", taxPensionController.listTaxRates);
router.get("/tax/:id", taxPensionController.getTaxRate);
router.put("/tax/:id", taxPensionController.updateTaxRate);
router.delete("/tax/:id", taxPensionController.deleteTaxRate);

// Pension rate routes
router.post("/pension", taxPensionController.createPensionRate);
router.get("/pension", taxPensionController.listPensionRates);
router.get("/pension/:id", taxPensionController.getPensionRate);
router.put("/pension/:id", taxPensionController.updatePensionRate);
router.delete("/pension/:id", taxPensionController.deletePensionRate);

export default router;

