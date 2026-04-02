/**
 * Captures presentation PNGs into presentation-exports/.
 * Prerequisite: production server running, e.g.
 *   npm run build && npm run start -- -p 3999
 * Override URL: set PRESENTATION_URL=http://127.0.0.1:3999
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const base = (process.env.PRESENTATION_URL || "http://127.0.0.1:3999").replace(
  /\/$/,
  "",
);
const vp = "1600,1000";
const wait = "4000";

try {
  const res = await fetch(base, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (e) {
  console.error(
    `Cannot reach ${base}. Run: npm run build && npm run start -- -p 3999`,
  );
  process.exit(1);
}

mkdirSync("presentation-exports", { recursive: true });

const pages = [
  ["/login", "01-login.png"],
  ["/", "02-dashboard.png"],
  ["/apply-hub", "03-apply-hub.png"],
  ["/bio-vault", "04-bio-vault.png"],
  ["/network", "05-network-crm.png"],
];

for (const [path, name] of pages) {
  const url = new URL(path, base).href;
  execSync(
    `npx --yes playwright@1.49.1 screenshot "${url}" "presentation-exports/${name}" --viewport-size=${vp} --wait-for-timeout=${wait}`,
    { stdio: "inherit", shell: true, cwd: process.cwd() },
  );
}

console.log("Done → presentation-exports/*.png and index.html");
