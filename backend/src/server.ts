import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/index.js";
import { initializeDataSource, AppDataSource } from "./db/data-source.js";

const app = express();
// Use 3000 as default to avoid Windows port permission issues with 4000
const PORT = parseInt(process.env.PORT || "3000", 10);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (_origin, callback) => callback(null, true),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
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
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit immediately, let the server try to recover
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

let server: any = null;

initializeDataSource()
  .then(() => {
    console.log("✅ Database connection initialized");
    
    // Only listen once - bind to localhost instead of 0.0.0.0 to avoid permission issues
    if (!server) {
      server = app.listen(PORT, "127.0.0.1", () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
      });

      // Keep server alive on errors
      server.on("error", (error: any) => {
        console.error("Server error:", error);
        if (error.code === "EADDRINUSE") {
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
        } else if (error.code === "EACCES") {
          console.error(`Permission denied. Try using a different port (e.g., 3000 or 5000) or run as administrator.`);
          process.exit(1);
        }
      });
    }
  })
  .catch((err) => {
    console.error("Failed to initialize database connection:", err);
    console.error("Error details:", err.message);
    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log("Retrying database connection...");
      initializeDataSource()
        .then(() => {
          console.log("✅ Database reconnected");
          if (!server) {
            server = app.listen(PORT, "127.0.0.1", () => {
              console.log(`🚀 Server running on port ${PORT}`);
            });
          }
        })
        .catch((retryErr) => {
          console.error("Retry failed:", retryErr);
        });
    }, 5000);
  });
