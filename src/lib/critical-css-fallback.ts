/**
 * Inlined in <head> so the UI stays readable if the main CSS chunk fails to load
 * (stale dev cache, ad-blockers, flaky network, chunk mismatch after edits).
 * Keep tokens in sync with `src/app/globals.css` @layer base :root.
 */
export const CRITICAL_CSS_FALLBACK = `
html{color-scheme:light}
html body{margin:0;min-height:100vh;background-color:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased;font-family:system-ui,sans-serif}
html a{color:#0891b2;text-decoration:none}
html a:hover{color:#0e7490;text-decoration:underline}
html .ch-shell-bg{min-height:100vh;background-color:#f8fafc;color:#0f172a}
html{
  --background:#f8fafc;
  --foreground:#0f172a;
  --card:#ffffff;
  --card-foreground:#0f172a;
  --popover:#ffffff;
  --popover-foreground:#0f172a;
  --primary:#0891b2;
  --primary-foreground:#ffffff;
  --secondary:#f1f5f9;
  --secondary-foreground:#0f172a;
  --muted:#f1f5f9;
  --muted-foreground:#64748b;
  --accent:#f1f5f9;
  --accent-foreground:#0f172a;
  --destructive:#dc2626;
  --border:#e2e8f0;
  --input:#e2e8f0;
  --ring:rgba(8,145,178,0.35);
  --radius:0.625rem;
}
`;
