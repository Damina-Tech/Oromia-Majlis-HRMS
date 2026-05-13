import { Router } from "express";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  generateDocument,
  listGeneratedDocuments,
  downloadDocument,
  getMergeFields,
  uploadTemplateSourceFile,
} from "./document.controller.js";
import {
  getDocumentSettings,
  createDocumentSettings,
  updateDocumentSettings,
} from "./document-settings.controller.js";
import {
  createDocumentRequest,
  listDocumentRequests,
  getDocumentRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from "./document-request.controller.js";
import { hasPermission } from "../../middleware/auth.js";
import { uploadDocumentTemplateSourceFile } from "../../lib/upload.js";

const router = Router();

// Must be registered before /templates/:id so "source-upload" is not captured as an id
router.post(
  "/templates/source-upload",
  hasPermission("documents.manage"),
  uploadDocumentTemplateSourceFile.single("file"),
  uploadTemplateSourceFile
);

// Template routes
router.get("/templates", hasPermission("documents.view"), listTemplates);
router.get("/templates/:id", hasPermission("documents.view"), getTemplate);
router.post("/templates", hasPermission("documents.manage"), createTemplate);
router.put("/templates/:id", hasPermission("documents.manage"), updateTemplate);
router.delete("/templates/:id", hasPermission("documents.manage"), deleteTemplate);

// Preview and generation
router.post("/templates/preview", hasPermission("documents.view"), previewTemplate);
router.post("/generate", hasPermission("documents.manage"), generateDocument);

// Generated documents
router.get("/generated", listGeneratedDocuments);
router.get("/generated/:id/download", downloadDocument);

// Document settings
router.get("/settings", getDocumentSettings);
router.post("/settings", hasPermission("documents.manage"), createDocumentSettings);
router.put("/settings", hasPermission("documents.manage"), updateDocumentSettings);

// Document requests
router.post("/requests", createDocumentRequest);
router.get("/requests", listDocumentRequests);
router.get("/requests/:id", getDocumentRequest);
router.put("/requests/:id", hasPermission("documents.manage"), updateDocumentRequest);
router.delete("/requests/:id", deleteDocumentRequest);

// Merge fields
router.get("/merge-fields", getMergeFields);

export default router;

