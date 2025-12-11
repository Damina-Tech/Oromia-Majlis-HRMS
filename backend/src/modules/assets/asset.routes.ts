import { Router } from "express";
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  deleteAsset,
  getAssetStats,
  getAssetHistory,
  bulkUpdateAssets,
} from "./asset.controller.js";
import {
  listAssetCategories,
  getAssetCategory,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
} from "./asset-category.controller.js";
import {
  listAssetLocations,
  getAssetLocation,
  createAssetLocation,
  updateAssetLocation,
  deleteAssetLocation,
} from "./asset-location.controller.js";
import {
  listAssetVendors,
  getAssetVendor,
  createAssetVendor,
  updateAssetVendor,
  deleteAssetVendor,
} from "./asset-vendor.controller.js";
import {
  listAssetMaintenance,
  getAssetMaintenance,
  createAssetMaintenance,
  updateAssetMaintenance,
  deleteAssetMaintenance,
} from "./asset-maintenance.controller.js";
import {
  listAssetDisposals,
  getAssetDisposal,
  createAssetDisposal,
} from "./asset-disposal.controller.js";
import {
  listAssetDepreciation,
  getAssetDepreciation,
  runDepreciation,
} from "./asset-depreciation.controller.js";

const router = Router();

// Asset CRUD routes - specific routes must come before generic :id route
router.get("/", listAssets); // GET /api/v1/assets
router.get("/stats", getAssetStats); // GET /api/v1/assets/stats
router.get("/history", getAssetHistory); // GET /api/v1/assets/history

// Bulk operations
router.put("/bulk/update", bulkUpdateAssets); // PUT /api/v1/assets/bulk/update

// Asset Category routes
router.get("/categories/all", listAssetCategories); // GET /api/v1/assets/categories/all
router.get("/categories/:id", getAssetCategory); // GET /api/v1/assets/categories/:id
router.post("/categories", createAssetCategory); // POST /api/v1/assets/categories
router.put("/categories/:id", updateAssetCategory); // PUT /api/v1/assets/categories/:id
router.delete("/categories/:id", deleteAssetCategory); // DELETE /api/v1/assets/categories/:id

// Asset Location routes
router.get("/locations/all", listAssetLocations); // GET /api/v1/assets/locations/all
router.get("/locations/:id", getAssetLocation); // GET /api/v1/assets/locations/:id
router.post("/locations", createAssetLocation); // POST /api/v1/assets/locations
router.put("/locations/:id", updateAssetLocation); // PUT /api/v1/assets/locations/:id
router.delete("/locations/:id", deleteAssetLocation); // DELETE /api/v1/assets/locations/:id

// Asset Vendor routes
router.get("/vendors", listAssetVendors); // GET /api/v1/assets/vendors
router.get("/vendors/:id", getAssetVendor); // GET /api/v1/assets/vendors/:id
router.post("/vendors", createAssetVendor); // POST /api/v1/assets/vendors
router.put("/vendors/:id", updateAssetVendor); // PUT /api/v1/assets/vendors/:id
router.delete("/vendors/:id", deleteAssetVendor); // DELETE /api/v1/assets/vendors/:id

// Asset Maintenance routes
router.get("/maintenance", listAssetMaintenance); // GET /api/v1/assets/maintenance
router.get("/maintenance/:id", getAssetMaintenance); // GET /api/v1/assets/maintenance/:id
router.post("/:id/maintenance", createAssetMaintenance); // POST /api/v1/assets/:id/maintenance
router.put("/maintenance/:id", updateAssetMaintenance); // PUT /api/v1/assets/maintenance/:id
router.delete("/maintenance/:id", deleteAssetMaintenance); // DELETE /api/v1/assets/maintenance/:id

// Asset Disposal routes
router.get("/disposals", listAssetDisposals); // GET /api/v1/assets/disposals
router.get("/disposals/:id", getAssetDisposal); // GET /api/v1/assets/disposals/:id
router.post("/:id/dispose", createAssetDisposal); // POST /api/v1/assets/:id/dispose

// Asset Depreciation routes
router.get("/depreciation", listAssetDepreciation); // GET /api/v1/assets/depreciation
router.get("/depreciation/:id", getAssetDepreciation); // GET /api/v1/assets/depreciation/:id
router.post("/depreciation/run", runDepreciation); // POST /api/v1/assets/depreciation/run

// Asset assignment routes (must come before :id route)
router.post("/:id/assign", assignAsset); // POST /api/v1/assets/:id/assign
router.post("/:id/return", returnAsset); // POST /api/v1/assets/:id/return

// Generic asset routes (must come last)
router.get("/:id", getAsset); // GET /api/v1/assets/:id
router.post("/", createAsset); // POST /api/v1/assets
router.put("/:id", updateAsset); // PUT /api/v1/assets/:id
router.delete("/:id", deleteAsset); // DELETE /api/v1/assets/:id

export default router;
