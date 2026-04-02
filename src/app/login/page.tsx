import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { HeroBackdrop } from "@/components/ui/hero-backdrop";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <HeroBackdrop>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/90">
            Career-Hub AI
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
            Welcome back
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
            After you sign in, dashboard metrics load from your Supabase data
            (protected with RLS).
          </p>
        </header>

        <LoginForm />

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mt-10 self-center border border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white",
          )}
        >
          Back to dashboard
        </Link>
      </div>
    </HeroBackdrop>
  );
}
