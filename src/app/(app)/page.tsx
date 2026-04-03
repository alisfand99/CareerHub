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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="flex flex-col gap-20 md:gap-24">
      <section className="ch-section-rail space-y-6 border-cyan-500/25">
        <p className="ch-eyebrow">Career intelligence</p>
        <h1 className="ch-display max-w-4xl">
          Your career{" "}
          <span className="text-white/35">command center.</span>
        </h1>
        <p className="ch-body max-w-2xl">
          Orchestrate applications, evidence in Bio-Vault, and network motion
          from one calm surface — built for clarity under pressure.
        </p>
      </section>

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

      <Tabs defaultValue="apply" className="w-full">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="ch-section-rail space-y-2 border-cyan-500/20">
            <p className="ch-eyebrow !text-[0.55rem]">Metrics</p>
            <div className="flex flex-wrap items-center gap-3 font-serif text-sm text-white/55">
              <LayoutGrid className="size-4 shrink-0 text-cyan-500/70" aria-hidden />
              <span>Explore by pillar</span>
              <DashboardTourDialog />
            </div>
          </div>
        </div>
        <TabsList className="grid h-auto w-full max-w-xl grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-sm">
          <TabsTrigger
            value="apply"
            className="py-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] data-active:border data-active:border-cyan-500/30 data-active:bg-white/[0.08] data-active:text-cyan-200"
          >
            Apply
          </TabsTrigger>
          <TabsTrigger
            value="bio"
            className="py-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] data-active:border data-active:border-cyan-500/30 data-active:bg-white/[0.08] data-active:text-cyan-200"
          >
            Bio-Vault
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="py-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] data-active:border data-active:border-cyan-500/30 data-active:bg-white/[0.08] data-active:text-cyan-200"
          >
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-10 outline-none">
          <div className="grid gap-8 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-cyan-400/80" aria-hidden />
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
                    <div className="mb-1.5 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-white/70">
                      <span className="font-medium text-white/90">
                        {jobLabels[key] ?? key}
                      </span>
                      <span className="tabular-nums text-cyan-500/80">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-cyan-500/70 transition-all duration-500"
                        style={{
                          width: `${(count / pipelineMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Pipeline distribution</CardTitle>
                <CardDescription>
                  Counts update when you add roles or move them between stages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineEntries.map(([key, count]) => (
                      <TableRow key={key} className="border-white/10">
                        <TableCell className="font-medium">
                          {jobLabels[key] ?? key}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bio" className="mt-10 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Skill engine depth</CardTitle>
              <CardDescription>
                Skills, projects, and work history you’ve saved in Bio-Vault.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-cyan-500/25">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-500/80">
                  Vault messages
                </p>
                <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-white">
                  {stats.bioMessagesCount}
                </p>
                <p className="mt-3 font-serif text-xs font-light leading-relaxed text-white/50">
                  Conversations you’ve had with the career assistant.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-cyan-500/25">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-500/80">
                  Structured atoms
                </p>
                <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-white">
                  {stats.skillsCount + stats.projectsCount + stats.experienceCount}
                </p>
                <p className="mt-3 font-serif text-xs font-light leading-relaxed text-white/50">
                  Powers tailored résumés and job fit insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="mt-10 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Relationship graph</CardTitle>
              <CardDescription>
                Contacts and referral paths toward target roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-cyan-500/25">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-500/80">
                  Contacts
                </p>
                <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-white">
                  {stats.contactsCount}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-cyan-500/25">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-500/80">
                  Referral mappings
                </p>
                <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-white">
                  {stats.referralLinksCount}
                </p>
                <p className="mt-3 font-serif text-xs font-light leading-relaxed text-white/50">
                  Links between people and the roles you’re pursuing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
