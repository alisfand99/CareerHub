/**
 * Inlined in <head> so the UI stays readable if the main CSS chunk fails to load
 * (stale dev cache, ad-blockers, flaky network, chunk mismatch after edits).
 * Keep `.dark` tokens in sync with `src/app/globals.css` @layer base .dark.
 */
export const CRITICAL_CSS_FALLBACK = `
html.dark{color-scheme:dark}
html.dark body{margin:0;min-height:100vh;background-color:#050505;color:#e4e4e7;-webkit-font-smoothing:antialiased}
html.dark a{color:#5eead4;text-decoration:none}
html.dark a:hover{color:#99f6e4;text-decoration:underline}
html.dark .ch-shell-bg{min-height:100vh;background-color:#050505;color:#f5f5f5}
html.dark{
  --background:#050505;
  --foreground:#fafafa;
  --card:rgba(255,255,255,0.06);
  --card-foreground:#fafafa;
  --popover:#0a0a0a;
  --popover-foreground:#fafafa;
  --primary:#22d3ee;
  --primary-foreground:#050505;
  --secondary:rgba(255,255,255,0.08);
  --secondary-foreground:#fafafa;
  --muted:rgba(255,255,255,0.06);
  --muted-foreground:#a1a1aa;
  --accent:rgba(255,255,255,0.08);
  --accent-foreground:#fafafa;
  --destructive:#f87171;
  --border:rgba(255,255,255,0.1);
  --input:rgba(255,255,255,0.12);
  --ring:rgba(34,211,238,0.45);
  --radius:0.625rem;
}
`;
