/**
 * Applies supabase/provision_all.sql when Postgres credentials are available.
 *
 * Set ONE of:
 *   DATABASE_URL=postgresql://postgres:PASSWORD@db.<ref>.supabase.co:6543/postgres
 *   SUPABASE_DB_PASSWORD=<database password>  (builds URI on db.<ref>.supabase.co — default port 6543 pooler; 5432 often IPv6-only)
 *   SUPABASE_DB_PORT=5432  (optional override)
 *
 * Password: Supabase Dashboard → Settings → Database → Database password
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const pw = process.env.SUPABASE_DB_PASSWORD;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!pw || !pub) return null;
  let host;
  try {
    host = new URL(pub).hostname;
  } catch {
    return null;
  }
  const ref = host.split(".")[0];
  const enc = encodeURIComponent(pw);
  const port = process.env.SUPABASE_DB_PORT || "6543";
  return `postgresql://postgres:${enc}@db.${ref}.supabase.co:${port}/postgres`;
}

async function main() {
  const sqlPath = path.join(root, "supabase", "provision_all.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const conn = buildDatabaseUrl();

  if (!conn) {
    console.error(
      "[provision] Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local, then re-run npm run db:provision.",
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 60000,
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("[provision] OK — schema + seed applied.");
    console.log("[provision] Test user: tester@careerhub.local / CareerHub_Test_2026!");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[provision] Failed:", err.message);
  process.exit(1);
});
