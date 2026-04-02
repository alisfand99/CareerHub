import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), ".next");
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log(
    "Removed .next (fresh dev build). Use a single terminal; do not run `npm run build` then `npm run dev` without this clean.",
  );
} else {
  console.log("No .next folder to remove.");
}
