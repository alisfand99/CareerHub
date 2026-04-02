"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatAuthError(err: unknown): string {
  if (err instanceof Error && err.message.includes("MISSING_SUPABASE_ENV")) {
    return "Supabase is not configured. On Vercel: Settings → Environment Variables — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY), then Redeploy. Locally, use .env.local.";
  }
  if (err instanceof Error && err.message.length > 0) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
        return;
      }
      router.refresh();
      router.push("/");
    } catch (err) {
      setIsError(true);
      setMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = cn(
    "box-border w-full min-h-12 rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm",
    "placeholder:text-slate-400 outline-none transition-colors",
    "focus-visible:border-brand-action focus-visible:ring-2 focus-visible:ring-brand-action/25",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
  );

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-sm border border-slate-200/90 bg-white p-8 shadow-xl md:p-10",
      )}
    >
      <h2 className="text-lg font-bold tracking-tight text-brand-navy">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter the email and password for your Supabase account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col gap-5">
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
            Email
          </Label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Label
            htmlFor="login-password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </Label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className={cn(
            "mt-1 h-12 w-full rounded-sm border-0 bg-brand-action text-base font-semibold text-white shadow-sm",
            "hover:bg-brand-action-hover focus-visible:ring-brand-action/40",
          )}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        {message ? (
          <p
            role="alert"
            className={cn(
              "rounded-sm px-3 py-2.5 text-sm leading-relaxed",
              isError
                ? "bg-red-50 text-red-800 ring-1 ring-red-200"
                : "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
            )}
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
