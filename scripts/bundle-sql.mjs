import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "supabase", "provision_all.sql");
const combined =
  fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8") +
  "\n" +
  fs.readFileSync(path.join(root, "supabase", "seed_dummy.sql"), "utf8");
fs.writeFileSync(out, combined, "utf8");
console.log("Wrote", out);
