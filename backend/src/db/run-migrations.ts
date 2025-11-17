import "dotenv/config";
import "reflect-metadata";
import { AppDataSource, initializeDataSource } from "./data-source.js";

async function runMigrations() {
  await initializeDataSource();
  const migrations = await AppDataSource.runMigrations();
  console.log(`✅ Ran ${migrations.length} migration(s)`);
  await AppDataSource.destroy();
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

