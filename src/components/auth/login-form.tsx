"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatAuthError(err: unknown): string {
  if (err instanceof Error && err.message.includes("MISSING_SUPABASE_ENV")) {
    return "Sign-in isn’t available yet because this app hasn’t finished setup. If you manage it, complete your hosting provider’s connection checklist, then publish again.";
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
    "box-border w-full min-h-12 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm",
    "placeholder:text-slate-400 outline-none transition-all duration-500",
    "focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-200",
    "disabled:cursor-not-allowed disabled:opacity-45",
  );

  return (
    <div
      className={cn(
        "ch-glass-card mx-auto w-full max-w-md border-cyan-100/80 p-8 shadow-lg md:p-10",
      )}
    >
      <h2 className="font-serif text-xl font-medium tracking-tight text-slate-900 md:text-2xl">
        Sign in
      </h2>
      <p className="mt-2 text-sm font-normal leading-relaxed text-slate-600">
        Use the email and password you use for Career Hub.
      </p>

      <form onSubmit={onSubmit} className="relative z-[1] mt-8 flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-2">
          <Label
            htmlFor="login-email"
            className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-cyan-700"
          >
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
            className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-cyan-700"
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

        {message ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed",
              isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-slate-50 text-slate-700",
            )}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
