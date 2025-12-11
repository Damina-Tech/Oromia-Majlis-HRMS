import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../src/db/client.js";
import { LeadStage, LeadPriority, LeadStatus } from "@prisma/client";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for the CSV file
const possiblePaths = [
  path.join(process.cwd(), "..", "lead_list.csv"),
  path.join(process.cwd(), "lead_list.csv"),
  path.resolve(__dirname, "..", "..", "lead_list.csv"),
];

interface CSVRow {
  full_name: string;
  phone?: string;
  email?: string;
  gender?: string;
  education?: string;
  address?: string;
}

function normalizeRow(row: Record<string, any>): CSVRow {
  const normalized: CSVRow = {
    full_name: "",
  };

  // Normalize field names (case-insensitive, handle spaces/underscores)
  const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\s]/g, "");

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeKey(key);
    const stringValue = value ? String(value).trim() : "";

    if (normalizedKey === "fullname") {
      normalized.full_name = stringValue;
    } else if (normalizedKey === "phone" || normalizedKey === "phonenumber") {
      normalized.phone = stringValue || undefined;
    } else if (normalizedKey === "email" || normalizedKey === "emailaddress") {
      normalized.email = stringValue || undefined;
    } else if (normalizedKey === "gender") {
      normalized.gender = stringValue || undefined;
    } else if (normalizedKey === "education") {
      normalized.education = stringValue || undefined;
    } else if (normalizedKey === "address" || normalizedKey === "location") {
      normalized.address = stringValue || undefined;
    }
  }

  return normalized;
}

async function importLeads() {
  try {
    // Find the CSV file
    let csvFile = "";
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        csvFile = possiblePath;
        break;
      } catch {
        continue;
      }
    }

    if (!csvFile) {
      throw new Error(`CSV file not found. Tried: ${possiblePaths.join(", ")}`);
    }

    console.log(`Reading CSV file from: ${csvFile}`);
    const fileContent = await fs.readFile(csvFile, "utf-8");

    console.log("Parsing CSV...");
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    console.log(`Found ${rows.length} rows to import`);

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get a system admin user ID for createdBy (or use first user)
    const adminUser = await prisma.user.findFirst({
      where: { email: { contains: "admin", mode: "insensitive" } },
    });

    if (!adminUser) {
      throw new Error("No admin user found. Please ensure at least one user exists in the database.");
    }

    const batchSize = 500; // Increased batch size for better performance
    const totalBatches = Math.ceil(rows.length / batchSize);

    console.log(`Importing ${rows.length} leads in batches of ${batchSize}...`);
    console.log("Note: All leads will be imported without duplicate checking.\n");

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, rows.length);
      const batch = rows.slice(start, end);

      // Prepare batch data
      const leadsToCreate: Array<{
        fullName: string;
        phone: string | null;
        email: string | null;
        address: string | null;
        location: string | null;
        gender: string | null;
        education: string | null;
        stage: LeadStage;
        priority: LeadPriority;
        status: LeadStatus;
        tags: string[];
        createdBy: string;
      }> = [];
      
      for (let i = 0; i < batch.length; i++) {
        const rawRow = batch[i];
        const row = normalizeRow(rawRow);

        // Skip if no full name
        if (!row.full_name || !row.full_name.trim()) {
          failed++;
          errors.push(`Row ${start + i + 2}: Missing full_name`);
          continue;
        }

        leadsToCreate.push({
          fullName: row.full_name.trim(),
          phone: row.phone?.trim() || null,
          email: row.email?.trim() || null,
          address: row.address?.trim() || null,
          location: row.address?.trim() || null, // Also set location for backward compatibility
          gender: row.gender?.trim() || null,
          education: row.education?.trim() || null,
          stage: LeadStage.NEW,
          priority: LeadPriority.MEDIUM,
          status: LeadStatus.ACTIVE,
          tags: [], // Required field - empty array
          createdBy: adminUser.id,
        });
      }

      // Create leads in batch using transaction for better performance
      if (leadsToCreate.length > 0) {
        try {
          // Use transaction callback form for better error handling
          await prisma.$transaction(async (tx) => {
            for (const leadData of leadsToCreate) {
              await tx.lead.create({
                data: leadData,
              });
            }
          });
          created += leadsToCreate.length;
        } catch (error: any) {
          // If batch fails, try individual creates
          console.warn(`Batch ${batchIndex + 1} failed, trying individual creates...`);
          for (let j = 0; j < leadsToCreate.length; j++) {
            try {
              await prisma.lead.create({
                data: leadsToCreate[j],
              });
              created++;
            } catch (individualError: any) {
              failed++;
              const errorMsg = `Row ${start + j + 2}: ${individualError.message || "Unknown error"}`;
              errors.push(errorMsg);
              if (errors.length <= 50) {
                console.error(errorMsg);
              }
            }
          }
        }
      }

      // Progress update
      const progress = ((batchIndex + 1) / totalBatches) * 100;
      console.log(`Progress: ${progress.toFixed(1)}% (${created} created, ${failed} failed)`);
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total rows: ${rows.length}`);
    console.log(`Created: ${created}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((created / rows.length) * 100).toFixed(2)}%`);

    if (errors.length > 0) {
      console.log(`\nFirst ${Math.min(50, errors.length)} errors:`);
      errors.slice(0, 50).forEach((error) => console.log(`  - ${error}`));
      if (errors.length > 50) {
        console.log(`  ... and ${errors.length - 50} more errors`);
      }
    }

    console.log("\nImport completed!");
  } catch (error: any) {
    console.error("Failed to import leads:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importLeads();

