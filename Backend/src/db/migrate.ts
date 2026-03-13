import fs from "fs";
import path from "path";
import { getPool } from "./pool";

export async function runMigrations() {
  // schema.sql is in src/models/schema.sql
  const schemaPath = path.join(__dirname, "../models/schema.sql");

  if (!fs.existsSync(schemaPath)) {
    console.warn(`⚠️  No schema.sql found at ${schemaPath}, skipping migrations.`);
    return;
  }

  const sql = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons to run each statement individually
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const pool = getPool();

  for (const statement of statements) {
    await pool.execute(statement);
  }

  console.log("✅ Database schema applied successfully.");
}