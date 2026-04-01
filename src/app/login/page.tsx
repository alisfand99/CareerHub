import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
        <header className="mb-10 text-center">
          <p className="text-sm font-medium text-zinc-400">Career-Hub AI</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            ورود به حساب
          </h1>
        </header>

        <LoginForm />

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mt-10 self-center text-zinc-500 hover:text-zinc-300",
          )}
        >
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
