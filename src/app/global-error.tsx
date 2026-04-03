"use client";

/**
 * Root-level error UI: must define html/body and import globals so a crashed
 * root layout still shows Tailwind styles (otherwise raw HTML).
 */
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[global-error]", error.digest ?? error.message, error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050505] font-serif text-foreground antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              {error.message || "A critical error occurred. Try reloading the page."}
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground/80">
                Reference: {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
              onClick={() => reset()}
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
