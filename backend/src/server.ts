import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/index.js";
import { processScheduledAnnouncements, retryFailedDeliveries } from "./modules/announcements/scheduler.js";
import { startNotificationWorker } from "./modules/notifications/notification.queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));

// Rate limiting - more lenient for development
// In development, use much higher limits or disable entirely
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === "/health";
    }
  });
  
  // Apply rate limiting to all routes except static files
  app.use("/api", limiter);
} else {
  // In development, use a very lenient rate limit
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10000, // Very high limit for development
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === "/health";
    }
  });
  
  app.use("/api", devLimiter);
  console.log("⚠️  Development mode: Using lenient rate limiting (10000 requests/minute)");
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("combined"));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/uploads/tasks", express.static(path.join(__dirname, "../uploads/tasks")));
app.use("/uploads/expenses", express.static(path.join(__dirname, "../uploads/expenses")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Debug: Log all incoming requests to /api (before routing)
app.use("/api", (req, res, next) => {
  console.log(`🔍 [SERVER] Incoming API Request: ${req.method} ${req.path || req.url}`);
  console.log(`🔍 [SERVER] Original URL: ${req.originalUrl}`);
  next();
});

// API routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === "development" ? err.message : undefined 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  
  // Start notification worker
  startNotificationWorker()
    .then((worker) => {
      if (worker) {
        console.log("✅ Notification delivery worker started");
      } else {
        console.log("⚠️ Notification delivery worker not started (Redis unavailable).");
      }
    })
    .catch((err) => {
      console.error("❌ Failed to start notification delivery worker:", err);
    });
  
  // Start announcement scheduler
  // Process scheduled announcements every minute
  setInterval(async () => {
    await processScheduledAnnouncements();
  }, 60 * 1000); // 1 minute
  
  // Retry failed deliveries every 5 minutes
  setInterval(async () => {
    await retryFailedDeliveries();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Run immediately on startup
  processScheduledAnnouncements().catch(console.error);
  console.log("✅ Announcement scheduler started");
});
