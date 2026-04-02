"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

function isChunkLoadError(err: Error): boolean {
  const m = err?.message ?? "";
  const n = err?.name ?? "";
  return (
    n === "ChunkLoadError" ||
    m.includes("Loading chunk") ||
    m.includes("Failed to fetch dynamically imported module") ||
    m.includes("Importing a module script failed")
  );
}

const RELOAD_KEY = "careerhub_chunk_reload_count";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunk = isChunkLoadError(error);

  useEffect(() => {
    if (!chunk || typeof window === "undefined") return;
    try {
      const prev = parseInt(sessionStorage.getItem(RELOAD_KEY) ?? "0", 10);
      if (prev < 2) {
        sessionStorage.setItem(RELOAD_KEY, String(prev + 1));
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, [chunk]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {chunk ? "Updating app bundle…" : "Something went wrong"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {chunk
            ? "Your dev server replaced a JavaScript chunk. The page will reload automatically. If the overlay returns, stop every other Next terminal, then run npm run dev once."
            : error.message || "An unexpected error occurred."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_KEY);
            } catch {
              /* ignore */
            }
            window.location.href = "/";
          }}
        >
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
