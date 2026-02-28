import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import type { Express } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/employee-documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarUploadsDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(avatarUploadsDir)) {
  fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow certain file types
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed."));
  }
};

// File filter for CSV/Excel imports
const importFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /csv|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /text\/csv|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel/.test(file.mimetype);

  if (extname || mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV and Excel files are allowed."));
  }
};

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const avatarFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files (JPG, PNG, GIF, WEBP) are allowed."));
  }
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: avatarFileFilter,
});

// Configure multer for bulk imports (larger file size, CSV/Excel)
const importStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const importDir = path.join(__dirname, "../../uploads/employee-imports");
    if (!fs.existsSync(importDir)) {
      fs.mkdirSync(importDir, { recursive: true });
    }
    cb(null, importDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const uploadImport = multer({
  storage: importStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for bulk imports
  },
  fileFilter: importFileFilter,
});

export const uploadDir = uploadsDir;

// Task attachments upload configuration
const taskUploadsDir = path.join(__dirname, "../../uploads/tasks");
if (!fs.existsSync(taskUploadsDir)) {
  fs.mkdirSync(taskUploadsDir, { recursive: true });
}

const taskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, taskUploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const uploadTaskAttachment = multer({
  storage: taskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

// Expense receipts upload configuration
const expenseUploadsDir = path.join(__dirname, "../uploads/expenses");
if (!fs.existsSync(expenseUploadsDir)) {
  fs.mkdirSync(expenseUploadsDir, { recursive: true });
}

const expenseStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, expenseUploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const uploadExpenseReceipt = multer({
  storage: expenseStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

// Halal certification uploads (license, documents, inspection evidence)
const halalUploadsDir = path.join(__dirname, "../../uploads/halal");
if (!fs.existsSync(halalUploadsDir)) {
  fs.mkdirSync(halalUploadsDir, { recursive: true });
}

const halalFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|pdf|doc|docx|mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = /image\/|application\/pdf|application\/msword|application\/vnd\.|video\//.test(file.mimetype);
  if (allowed.test(ext) || mime) cb(null, true);
  else cb(new Error("Invalid file type. Allowed: images, PDF, DOC, video"));
};

const halalStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, halalUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadHalalFile = multer({
  storage: halalStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: halalFileFilter,
});

// Membership (profile photo, receipts)
const membershipUploadsDir = path.join(__dirname, "../../uploads/membership");
if (!fs.existsSync(membershipUploadsDir)) {
  fs.mkdirSync(membershipUploadsDir, { recursive: true });
}
const membershipStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, membershipUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const membershipFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowed.test(ext) || /image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type. Allowed: JPEG, PNG"));
};
export const uploadMembershipFile = multer({
  storage: membershipStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: membershipFileFilter,
});

