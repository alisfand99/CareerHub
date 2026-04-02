import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchUserJobs } from "@/lib/queries/jobs";
import { ApplyHubBoard } from "./apply-hub-board";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { workspaceNotReady } from "@/lib/user-facing-copy";

export default async function ApplyHubPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Apply Hub</h1>
        <p className="text-sm text-muted-foreground">{workspaceNotReady}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Apply Hub</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view and manage your applications.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const jobs = await fetchUserJobs(supabase, user.id);

  return <ApplyHubBoard initialJobs={jobs} />;
}
