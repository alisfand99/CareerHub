import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "supabase", "provision_all.sql");
const patchesDir = path.join(root, "supabase", "patches");

let combined = fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8") + "\n";

const patchFiles = fs.existsSync(patchesDir)
  ? fs.readdirSync(patchesDir).filter((f) => f.endsWith(".sql")).sort()
  : [];

for (const f of patchFiles) {
  combined += `\n-- --- patch: ${f} ---\n`;
  combined += fs.readFileSync(path.join(patchesDir, f), "utf8") + "\n";
}

combined += "\n" + fs.readFileSync(path.join(root, "supabase", "seed_dummy.sql"), "utf8");
fs.writeFileSync(out, combined, "utf8");
console.log(
  "Wrote",
  out,
  patchFiles.length ? `(schema + ${patchFiles.length} patch(es) + seed)` : "(schema + seed)",
);
