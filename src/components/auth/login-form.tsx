"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatAuthError(err: unknown): string {
  if (err instanceof Error && err.message.includes("MISSING_SUPABASE_ENV")) {
    return "سرور به Supabase وصل نیست. در Vercel → Settings → Environment Variables مقدارهای NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY را بگذار و Redeploy کن.";
  }
  if (err instanceof Error && err.message.length > 0) {
    return err.message;
  }
  return "خطا در اتصال. دوباره تلاش کن.";
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

  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-xl border border-zinc-700/80 bg-zinc-900 p-8 shadow-lg",
        "mx-auto",
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
        ورود
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        ایمیل و رمز عبور حساب Supabase خود را وارد کن.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col gap-5">
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="login-email" className="text-sm text-zinc-300">
            ایمیل
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
            className={cn(
              "box-border w-full min-h-11 rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100",
              "placeholder:text-zinc-500 outline-none transition-colors",
              "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-500/30",
              "disabled:opacity-50",
            )}
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="login-password" className="text-sm text-zinc-300">
            رمز عبور
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
            className={cn(
              "box-border w-full min-h-11 rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-base text-zinc-100",
              "placeholder:text-zinc-500 outline-none transition-colors",
              "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-500/30",
              "disabled:opacity-50",
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-10 w-full text-sm font-medium"
        >
          {loading ? "در حال ورود…" : "ورود"}
        </Button>

        {message ? (
          <p
            role="alert"
            className={cn(
              "rounded-md px-3 py-2 text-sm leading-relaxed",
              isError
                ? "bg-red-950/50 text-red-200 ring-1 ring-red-500/30"
                : "text-zinc-400 ring-1 ring-zinc-700",
            )}
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
