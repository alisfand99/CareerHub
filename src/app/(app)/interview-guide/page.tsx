import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { workspaceNotReady } from "@/lib/user-facing-copy";
import { InterviewGuideWorkbench } from "@/components/interview-guide/interview-guide-workbench";

type JobOption = {
  id: string;
  title: string;
  company: string;
  status: string;
};

export default async function InterviewGuidePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Interview Guide</h1>
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
        <h1 className="text-2xl font-semibold">Interview Guide</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to generate interview plans from your jobs and Bio-Vault.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, status")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  const jobs = ((data ?? []) as JobOption[]).filter(
    (j) => j.id && j.title && j.company,
  );

  return <InterviewGuideWorkbench jobs={jobs} />;
}

