import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/employee-documents");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed."));
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
export const uploadDir = uploadsDir;
//# sourceMappingURL=upload.js.map