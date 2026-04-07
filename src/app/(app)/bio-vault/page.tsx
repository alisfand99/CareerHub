import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { extractMarketGaps } from "@/lib/market-gaps";
import { fetchSuperResumeBundle } from "@/lib/queries/super-resume";
import { SuperResumeEditor } from "@/components/bio-vault/super-resume-editor";
import { buttonVariants } from "@/components/ui/button-variants";
import { bioVaultPartialLoad, workspaceNotReady } from "@/lib/user-facing-copy";
import { cn } from "@/lib/utils";

export default async function BioVaultPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Bio-Vault</h1>
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
        <h1 className="text-2xl font-semibold">Bio-Vault</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to build and edit your super-resume.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const { bundle, hadLoadFailures } = await fetchSuperResumeBundle(
    supabase,
    user.id,
  );

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("id, title, company, status, jd_text, ai_insights")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const marketGaps = extractMarketGaps(jobRows ?? []);

  const { data: resumeMsg } = await supabase
    .from("bio_vault_messages")
    .select("metadata, created_at")
    .eq("user_id", user.id)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(25);

  const latestResume = resumeMsg?.find(
    (m) =>
      m.metadata &&
      typeof m.metadata === "object" &&
      (m.metadata as { type?: string }).type === "resume_refactor",
  );

  const assistantResumeDraft =
    latestResume &&
    typeof latestResume.metadata === "object" &&
    typeof (latestResume.metadata as { markdown?: string }).markdown === "string"
      ? (latestResume.metadata as { markdown: string }).markdown
      : null;

  return (
    <SuperResumeEditor
      userId={user.id}
      userEmail={user.email ?? ""}
      bundle={bundle}
      marketGaps={marketGaps}
      jobs={
        (jobRows ?? []).map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          status: j.status,
          jdText: typeof j.jd_text === "string" ? j.jd_text : null,
        }))
      }
      assistantResumeDraft={assistantResumeDraft}
      dataLoadWarning={hadLoadFailures ? bioVaultPartialLoad : null}
    />
  );
}
