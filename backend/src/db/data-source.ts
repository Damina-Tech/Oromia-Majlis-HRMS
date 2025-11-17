import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { fileURLToPath } from "url";
import path from "path";
import { User } from "../entities/User.js";
import { Role } from "../entities/Role.js";
import { Permission } from "../entities/Permission.js";
import { RolePermission } from "../entities/RolePermission.js";
import { UserRole } from "../entities/UserRole.js";
import { Department } from "../entities/Department.js";
import { Employee } from "../entities/Employee.js";
import { LeaveRequest } from "../entities/LeaveRequest.js";
import { LeaveBalance } from "../entities/LeaveBalance.js";
import { Attendance } from "../entities/Attendance.js";
import { Payroll } from "../entities/Payroll.js";
import { Timesheet } from "../entities/Timesheet.js";
import { TimesheetSession } from "../entities/TimesheetSession.js";
import { Asset } from "../entities/Asset.js";
import { AssetHistory } from "../entities/AssetHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ext = process.env.NODE_ENV === "production" ? "js" : "ts";

// Use discrete environment variables (like Prisma)
// Trim whitespace to avoid connection issues
const dbHost = process.env.DB_HOST?.trim() || "localhost";
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT.trim(), 10) : 5432;
const dbUser = process.env.DB_USERNAME?.trim();
// Ensure password is a string for pg SASL and trim whitespace
const dbPassword = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD).trim() : undefined;
const dbName = process.env.DB_DATABASE?.trim();

// Force IPv4 for localhost to avoid IPv6 connection issues
const normalizedHost = dbHost === "localhost" ? "127.0.0.1" : dbHost;

// SSL configuration - disabled by default, enable explicitly if needed
const sslConfig = process.env.DB_SSL === "true" 
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } 
  : false;

const common = {
  type: "postgres" as const,
  synchronize: process.env.DB_SYNCHRONIZE === "true",
  logging: process.env.DB_LOGGING === "true",
  entities: [
    User,
    Role,
    Permission,
    RolePermission,
    UserRole,
    Department,
    Employee,
    LeaveRequest,
    LeaveBalance,
    Attendance,
    Payroll,
    Timesheet,
    TimesheetSession,
    Asset,
    AssetHistory,
  ],
  migrations: [path.join(__dirname, `../../migrations/*.${ext}`)],
  migrationsTableName: "migrations",
};

export const AppDataSource = new DataSource({
  ...common,
  host: normalizedHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: sslConfig,
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  
  try {
    const dataSource = await AppDataSource.initialize();
    console.log("✅ Database connection established");
    return dataSource;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}


