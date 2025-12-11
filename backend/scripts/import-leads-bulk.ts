import { PrismaClient, LeadPriority, LeadStage } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function importLeadsBulk() {
  try {
    console.log("Reading CSV file...");
    const csvPath = path.join(process.cwd(), "..", "lead_list.csv");
    const fileContent = await fs.readFile(csvPath, "utf-8");
    
    console.log("Parsing CSV...");
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${rows.length} rows to import`);

    // Get the first admin user to use as creator
    const adminUser = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
      },
    });

    if (!adminUser) {
      throw new Error("No admin user found. Please ensure at least one admin user exists.");
    }

    console.log(`Using admin user: ${adminUser.email} as creator`);

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rows.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, rows.length)} of ${rows.length})`);

      for (const row of batch) {
        try {
          // Normalize the row data
          const fullName = (row.full_name || row.fullName || row.name || "").trim();
          const phone = (row.phone || "").trim() || null;
          const email = (row.email || "").trim() || null;
          const gender = (row.gender || "").trim() || null;
          const education = (row.education || "").trim() || null;
          const address = (row.address || row.location || "").trim() || null;

          // Skip if no name
          if (!fullName) {
            skipped++;
            continue;
          }

          // Create the lead without duplicate checking
          await prisma.lead.create({
            data: {
              fullName,
              phone,
              email,
              gender,
              education,
              address,
              location: address, // Also set location for backward compatibility
              priority: LeadPriority.MEDIUM,
              stage: LeadStage.NEW,
              createdBy: adminUser.id,
            },
          });

          created++;
        } catch (error: any) {
          failed++;
          const errorMsg = `Row ${i + batch.indexOf(row) + 2}: ${error.message}`;
          errors.push(errorMsg);
          if (errors.length <= 50) {
            console.error(errorMsg);
          }
        }
      }

      // Log progress every batch
      console.log(`Progress: ${created} created, ${skipped} skipped, ${failed} failed`);
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total rows: ${rows.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    if (errors.length > 0) {
      console.log(`\nFirst ${Math.min(50, errors.length)} errors:`);
      errors.slice(0, 50).forEach((err) => console.error(err));
      if (errors.length > 50) {
        console.log(`... and ${errors.length - 50} more errors`);
      }
    }
  } catch (error: any) {
    console.error("Failed to import leads:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importLeadsBulk()
  .then(() => {
    console.log("\nImport completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  });

