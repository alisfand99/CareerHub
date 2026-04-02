/**
 * Deep reset of local build caches (fixes missing chunk / ChunkLoadError after HMR refactors).
 * Run: npm run clean
 * Then start a single dev server: npm run dev
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function removeDir(absPath, label) {
  if (existsSync(absPath)) {
    rmSync(absPath, { recursive: true, force: true });
    console.log(`Removed ${label}`);
  } else {
    console.log(`Skip (not found): ${label}`);
  }
}

removeDir(join(root, ".next"), ".next");
removeDir(join(root, "node_modules", ".cache"), "node_modules/.cache");

console.log("Clean complete. Use one terminal: npm run dev");
