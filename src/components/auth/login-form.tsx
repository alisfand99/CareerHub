"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "password" | "magic";

function formatAuthError(err: unknown): string {
  if (err instanceof Error && err.message.includes("MISSING_SUPABASE_ENV")) {
    return "این دپلویمنت به Supabase وصل نیست. در Vercel برو Settings → Environment Variables و این دو را اضافه کن، بعد Redeploy: NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY (یا کلید publishable).";
  }
  if (err instanceof Error && err.message.length > 0) {
    return err.message;
  }
  return "خطای شبکه یا سرور. دوباره تلاش کن.";
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState(false);

  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicMessage, setMagicMessage] = useState<string | null>(null);
  const [magicError, setMagicError] = useState(false);

  async function onPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwMessage(null);
    setPwError(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setPwError(true);
        setPwMessage(error.message);
        return;
      }
      router.refresh();
      router.push("/");
    } catch (err) {
      setPwError(true);
      setPwMessage(formatAuthError(err));
    } finally {
      setPwLoading(false);
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicLoading(true);
    setMagicMessage(null);
    setMagicError(false);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        setMagicError(true);
        setMagicMessage(error.message);
        return;
      }
      setMagicError(false);
      setMagicMessage("لینک ورود به ایمیلت فرستاده شد.");
    } catch (err) {
      setMagicError(true);
      setMagicMessage(formatAuthError(err));
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[400px] border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <CardHeader className="space-y-1 pb-2 text-center sm:text-left">
        <CardTitle className="text-xl font-semibold tracking-tight">
          ورود
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-zinc-400">
          با ایمیل و رمز عبور، یا لینک یک‌بار مصرف.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div
          className="flex h-10 rounded-lg bg-zinc-900/80 p-1 ring-1 ring-white/10"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={cn(
              "flex-1 rounded-md text-sm font-medium transition-all",
              mode === "password"
                ? "bg-zinc-800 text-zinc-50 shadow-sm ring-1 ring-white/10"
                : "text-zinc-500 hover:text-zinc-300",
            )}
            onClick={() => {
              setMode("password");
              setPwMessage(null);
            }}
          >
            رمز عبور
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "magic"}
            className={cn(
              "flex-1 rounded-md text-sm font-medium transition-all",
              mode === "magic"
                ? "bg-zinc-800 text-zinc-50 shadow-sm ring-1 ring-white/10"
                : "text-zinc-500 hover:text-zinc-300",
            )}
            onClick={() => {
              setMode("magic");
              setMagicMessage(null);
            }}
          >
            لینک ایمیل
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={onPasswordSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-zinc-300">
                ایمیل
              </Label>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pwLoading}
                className="h-11 border-white/10 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-zinc-300">
                رمز عبور
              </Label>
              <Input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pwLoading}
                className="h-11 border-white/10 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full font-medium"
              disabled={pwLoading}
            >
              {pwLoading ? "در حال ورود…" : "ورود"}
            </Button>
            {pwMessage ? (
              <p
                className={cn(
                  "rounded-md border px-3 py-2 text-sm leading-snug",
                  pwError
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-white/10 text-zinc-400",
                )}
              >
                {pwMessage}
              </p>
            ) : null}
          </form>
        ) : (
          <form onSubmit={onMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email" className="text-zinc-300">
                ایمیل
              </Label>
              <Input
                id="magic-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                disabled={magicLoading}
                className="h-11 border-white/10 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="h-11 w-full font-medium"
              disabled={magicLoading}
            >
              {magicLoading ? "در حال ارسال…" : "ارسال لینک ورود"}
            </Button>
            {magicMessage ? (
              <p
                className={cn(
                  "rounded-md border px-3 py-2 text-sm leading-snug",
                  magicError
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
                )}
              >
                {magicMessage}
              </p>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
