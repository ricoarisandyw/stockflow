import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

async function syncDatabase() {
  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    console.log(`🚀 [Turso] Syncing database schema to ${url}...`);
    const client = createClient({ url, authToken });

    const migrationPath = path.join(
      process.cwd(),
      "prisma/migrations/20260902042103_first_init/migration.sql"
    );

    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, "utf8");
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await client.execute(statement);
        } catch (error) {
          // Table or index already exists, continue
        }
      }
      console.log("✨ [Turso] Database schema is in sync!");
    }
  } else {
    console.log("🪶 [SQLite] Syncing schema to local SQLite...");
    execSync("npx prisma db push", { stdio: "inherit" });
  }
}

syncDatabase().catch((err) => {
  console.error("Database sync error:", err);
  process.exit(1);
});
