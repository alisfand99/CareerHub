import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight text-primary">
          Career-Hub AI
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
      </div>
      <LoginForm />
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
