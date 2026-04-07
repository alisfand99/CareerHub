"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function UserMenu({
  email,
  variant = "panel",
}: {
  email: string | null;
  /** `header` = compact row (top bar). `panel` = sheet / stacked. */
  variant?: "panel" | "header";
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "secondary" }),
          variant === "panel"
            ? "w-full justify-start gap-2 normal-case tracking-normal"
            : "inline-flex gap-2 normal-case tracking-normal",
        )}
      >
        <LogIn className="size-4 text-cyan-600" aria-hidden />
        Sign in
      </Link>
    );
  }

  if (variant === "header") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 normal-case tracking-normal"
        onClick={() => void signOut()}
      >
        <LogOut className="size-3.5" aria-hidden />
        Sign out
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className="truncate px-1 font-mono text-[0.65rem] text-slate-500"
        title={email}
      >
        {email}
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => void signOut()}
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
