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
    "box-border w-full min-h-12 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white shadow-none backdrop-blur-sm",
    "placeholder:text-white/35 outline-none transition-all duration-500",
    "focus-visible:border-cyan-500/45 focus-visible:ring-2 focus-visible:ring-cyan-400/20",
    "disabled:cursor-not-allowed disabled:opacity-45",
  );

  return (
    <div
      className={cn(
        "ch-glass-card mx-auto w-full max-w-md p-8 md:p-10",
        "before:from-cyan-500/[0.06]",
      )}
    >
      <h2 className="font-serif text-xl font-medium tracking-tight text-white md:text-2xl">
        Sign in
      </h2>
      <p className="mt-2 font-serif text-sm font-light leading-relaxed text-white/60">
        Use the email and password you use for Career Hub.
      </p>

      <form onSubmit={onSubmit} className="relative z-[1] mt-8 flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-2">
          <Label
            htmlFor="login-email"
            className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-cyan-500/90"
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
            className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-cyan-500/90"
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
                ? "border-red-500/30 bg-red-500/10 text-red-200/90"
                : "border-white/10 bg-white/[0.04] text-white/75",
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
