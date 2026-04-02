import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { companiesMatch } from "@/lib/company-match";
import { fetchUserContacts } from "@/lib/queries/contacts";
import { fetchUserJobById } from "@/lib/queries/jobs";
import { JobCommandDeck } from "@/components/apply-hub/job-command-deck";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { workspaceNotReady } from "@/lib/user-facing-copy";

type PageProps = { params: { jobId: string } };

export default async function JobDetailPage({ params }: PageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Job briefing</h1>
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
        <h1 className="text-2xl font-semibold">Job briefing</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view this job.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const job = await fetchUserJobById(supabase, user.id, params.jobId);
  if (!job) notFound();

  const contacts = await fetchUserContacts(supabase, user.id);
  const companyConnections = contacts
    .filter((c) => companiesMatch(c.company, job.company))
    .map((c) => ({ id: c.id, full_name: c.full_name }));

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <JobCommandDeck job={job} companyConnections={companyConnections} />
    </div>
  );
}
