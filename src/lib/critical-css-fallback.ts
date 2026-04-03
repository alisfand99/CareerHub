/**
 * Inlined in <head> so the UI stays readable if the main CSS chunk fails to load
 * (stale dev cache, ad-blockers, flaky network, chunk mismatch after edits).
 * Keep `.dark` tokens in sync with `src/app/globals.css` @layer base .dark.
 */
export const CRITICAL_CSS_FALLBACK = `
html{color-scheme:light}
html body{margin:0;min-height:100vh;background-color:#f7fafc;color:#0f172a;-webkit-font-smoothing:antialiased}
html a{color:#0891b2;text-decoration:none}
html a:hover{color:#06b6d4;text-decoration:underline}
html .ch-shell-bg{min-height:100vh;background-color:#f7fafc;color:#0f172a}

html{
  --background:#f7fafc;
  --foreground:#0f172a;
  --card:rgba(255,255,255,0.72);
  --card-foreground:#0f172a;
  --popover:#ffffff;
  --popover-foreground:#0f172a;
  --primary:#06b6d4;
  --primary-foreground:#ffffff;
  --secondary:rgba(2,6,23,0.06);
  --secondary-foreground:#0f172a;
  --muted:#475569;
  --muted-foreground:#475569;
  --accent:rgba(6,182,212,0.15);
  --accent-foreground:#0891b2;
  --destructive:#f87171;
  --border:rgba(15,23,42,0.10);
  --input:rgba(15,23,42,0.10);
  --ring:rgba(8,145,178,0.35);
  --radius:0.625rem;
}
`;
