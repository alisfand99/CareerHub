"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function UserMenu({ email }: { email: string | null }) {
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
          "w-full justify-start gap-2",
        )}
      >
        <LogIn className="size-4" aria-hidden />
        Sign in
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <p className="truncate px-1 text-xs text-muted-foreground" title={email}>
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
