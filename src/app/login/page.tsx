import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(168,85,247,0.08),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_80%,rgba(34,211,238,0.06),transparent_40%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 ring-1 ring-white/15">
            <Sparkles className="size-7 text-indigo-300" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
              Career-Hub AI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              خوش برگشتی
            </h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              برای دیدن داشبورد و داده‌هایت وارد شو.
            </p>
          </div>
        </div>

        <LoginForm />

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mt-8 text-zinc-500 hover:text-zinc-300",
          )}
        >
          ← بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
