import { Router } from "express";
import { listAssets, getAsset, createAsset, updateAsset, assignAsset, revokeAsset, transferAsset, updateAssetStatus, deleteAsset, getAssetStats, getAssetHistory, bulkUpdateAssets, } from "./asset.controller.js";
const router = Router();
// Asset CRUD routes
router.get("/", listAssets); // GET /api/v1/assets
router.get("/stats", getAssetStats); // GET /api/v1/assets/stats
router.get("/history", getAssetHistory); // GET /api/v1/assets/history
router.get("/:id", getAsset); // GET /api/v1/assets/:id
router.post("/", createAsset); // POST /api/v1/assets
router.put("/:id", updateAsset); // PUT /api/v1/assets/:id
router.delete("/:id", deleteAsset); // DELETE /api/v1/assets/:id
// Asset assignment routes
router.post("/:id/assign", assignAsset); // POST /api/v1/assets/:id/assign
router.post("/:id/revoke", revokeAsset); // POST /api/v1/assets/:id/revoke
router.post("/:id/transfer", transferAsset); // POST /api/v1/assets/:id/transfer
// Asset status and condition routes
router.put("/:id/status", updateAssetStatus); // PUT /api/v1/assets/:id/status
// Bulk operations
router.put("/bulk/update", bulkUpdateAssets); // PUT /api/v1/assets/bulk/update
export default router;
//# sourceMappingURL=asset.routes.js.map