import Link from "next/link";
import { LayoutGrid, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  emptyDashboardStats,
  getDashboardStats,
} from "@/lib/queries/dashboard-stats";
import { CircularOrchestratorHub } from "@/components/dashboard/circular-orchestrator-hub";
import { DashboardTourDialog } from "@/components/dashboard/dashboard-tour-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  dataLoadFailed,
  firstTimeSetupHint,
  workspaceNotReady,
} from "@/lib/user-facing-copy";

const jobLabels: Record<string, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  let stats = emptyDashboardStats();
  let loadError: string | null = null;
  let signedIn = false;

  if (configured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      if (user) {
        const result = await getDashboardStats(supabase, user.id);
        stats = result.stats;
        loadError = result.error;
      }
    } catch {
      loadError = dataLoadFailed;
    }
  }

  const pipelineEntries = Object.entries(stats.jobsByStatus) as [
    keyof typeof stats.jobsByStatus,
    number,
  ][];
  const pipelineMax = Math.max(
    1,
    ...pipelineEntries.map(([, c]) => c),
  );

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {!configured ? (
        <Card className="border-amber-500/35 border-dashed bg-amber-500/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Setup required</CardTitle>
            <CardDescription>{workspaceNotReady}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {configured ? (
        <CircularOrchestratorHub
          applyCount={stats.jobsTotal}
          bioAtomCount={
            stats.skillsCount + stats.projectsCount + stats.experienceCount
          }
          networkCount={stats.contactsCount}
          signedIn={signedIn}
          configured={configured}
          pillarMetrics={{
            apply: {
              primary: `${stats.jobsTotal} roles`,
              secondary: `${stats.jobsByStatus.applied} applied`,
            },
            bio: {
              primary: `${stats.skillsCount} skills`,
              secondary: `${stats.projectsCount} projects`,
            },
            network: {
              primary: `${stats.contactsCount} contacts`,
              secondary: `${stats.referralLinksCount} referrals`,
            },
          }}
        />
      ) : null}

      {configured && loadError ? (
        <Card className="border-red-500/35 bg-red-500/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Data sync issue</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{firstTimeSetupHint}</p>
          </CardContent>
        </Card>
      ) : null}

      {configured && !signedIn ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign in to load your data</CardTitle>
            <CardDescription>
              Your jobs and profile are visible only after you sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={cn(buttonVariants())}>
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {configured ? (
        <div className="flex w-full min-w-0 flex-col gap-12 md:gap-16">
          <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="ch-section-rail min-w-0 space-y-2 border-cyan-500/35">
              <p className="ch-eyebrow !text-[0.55rem]">Metrics</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
                <LayoutGrid className="size-4 shrink-0 text-cyan-600" aria-hidden />
                <span>Explore by pillar</span>
                <DashboardTourDialog />
              </div>
            </div>
          </div>

          <section aria-labelledby="dash-metrics-apply" className="min-w-0">
            <h2
              id="dash-metrics-apply"
              className="mb-4 font-mono text-[0.65rem] font-medium uppercase tracking-[0.28em] text-cyan-700"
            >
              Apply Hub
            </h2>
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-cyan-600" aria-hidden />
                  <CardTitle>Pipeline load</CardTitle>
                </div>
                <CardDescription>
                  How your applications are spread across each stage in your
                  pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineEntries.map(([key, count]) => (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-slate-500">
                      <span className="font-medium text-slate-800">
                        {jobLabels[key] ?? key}
                      </span>
                      <span className="tabular-nums text-cyan-700">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/90">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{
                          width: `${(count / pipelineMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="dash-metrics-bio" className="min-w-0">
            <h2
              id="dash-metrics-bio"
              className="mb-4 font-mono text-[0.65rem] font-medium uppercase tracking-[0.28em] text-cyan-700"
            >
              Bio-Vault
            </h2>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Skill engine depth</CardTitle>
                <CardDescription>
                  Skills, projects, and work history you’ve saved in Bio-Vault.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white/80 p-6 shadow-sm transition-all duration-500 hover:border-cyan-200/90 sm:p-8">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-700">
                    Vault messages
                  </p>
                  <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-slate-900">
                    {stats.bioMessagesCount}
                  </p>
                  <p className="mt-3 text-xs font-normal leading-relaxed text-slate-500">
                    Conversations you’ve had with the career assistant.
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white/80 p-6 shadow-sm transition-all duration-500 hover:border-cyan-200/90 sm:p-8">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-700">
                    Structured atoms
                  </p>
                  <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-slate-900">
                    {stats.skillsCount +
                      stats.projectsCount +
                      stats.experienceCount}
                  </p>
                  <p className="mt-3 text-xs font-normal leading-relaxed text-slate-500">
                    Powers tailored résumés and job fit insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="dash-metrics-network" className="min-w-0">
            <h2
              id="dash-metrics-network"
              className="mb-4 font-mono text-[0.65rem] font-medium uppercase tracking-[0.28em] text-cyan-700"
            >
              Network CRM
            </h2>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Relationship graph</CardTitle>
                <CardDescription>
                  Contacts and referral paths toward target roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white/80 p-6 shadow-sm transition-all duration-500 hover:border-cyan-200/90 sm:p-8">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-700">
                    Contacts
                  </p>
                  <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-slate-900">
                    {stats.contactsCount}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white/80 p-6 shadow-sm transition-all duration-500 hover:border-cyan-200/90 sm:p-8">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-700">
                    Referral mappings
                  </p>
                  <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-slate-900">
                    {stats.referralLinksCount}
                  </p>
                  <p className="mt-3 text-xs font-normal leading-relaxed text-slate-500">
                    Links between people and the roles you’re pursuing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      ) : null}
    </div>
  );
}
