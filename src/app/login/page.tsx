import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { HeroBackdrop } from "@/components/ui/hero-backdrop";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <HeroBackdrop>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16 md:py-24">
        <header className="ch-section-rail mb-10 border-cyan-500/25 text-center md:text-left">
          <p className="ch-eyebrow">Career-Hub AI</p>
          <h1 className="ch-display mt-4">
            Welcome <span className="text-slate-400">back.</span>
          </h1>
          <p className="ch-body mx-auto mt-4 max-w-md md:mx-0">
            Sign in to open your command center. Your information stays private
            to your account.
          </p>
        </header>

        <LoginForm />

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mt-12 self-center md:self-start",
          )}
        >
          Back to dashboard
        </Link>
      </div>
    </HeroBackdrop>
  );
}
