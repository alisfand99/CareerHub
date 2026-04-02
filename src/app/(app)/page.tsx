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
      loadError =
        "Unable to reach Supabase. Check keys and that the project is running.";
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
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      {!configured ? (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Configure Supabase</CardTitle>
            <CardDescription>
              On Vercel (or your host):{" "}
              <strong className="text-foreground">Settings → Environment Variables</strong>{" "}
              — add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              (or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
              </code>
              ), then <strong className="text-foreground">Redeploy</strong>. Locally use{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>.
            </CardDescription>
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
        <Card className="border-destructive/40 bg-destructive/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Data sync issue</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If tables are missing, open the Supabase SQL Editor and execute{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                supabase/schema.sql
              </code>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}

      {configured && !signedIn ? (
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Sign in to load your data</CardTitle>
            <CardDescription>
              Row Level Security keeps each workspace private to your account.
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
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <LayoutGrid className="size-4 shrink-0 text-primary" aria-hidden />
            <span>Explore metrics by pillar</span>
            <DashboardTourDialog />
          </div>
        </div>
        <TabsList className="grid h-auto w-full max-w-xl grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1.5">
          <TabsTrigger value="apply" className="py-2.5">
            Apply
          </TabsTrigger>
          <TabsTrigger value="bio" className="py-2.5">
            Bio-Vault
          </TabsTrigger>
          <TabsTrigger value="network" className="py-2.5">
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="border-border/70 bg-card/80 shadow-md lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" aria-hidden />
                  <CardTitle className="text-base">Pipeline load</CardTitle>
                </div>
                <CardDescription>
                  Visual distribution across Kanban stages (live{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                    jobs
                  </code>{" "}
                  counts).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineEntries.map(([key, count]) => (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {jobLabels[key] ?? key}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-sm bg-muted/80">
                      <div
                        className="h-full rounded-sm bg-primary transition-all duration-500"
                        style={{
                          width: `${(count / pipelineMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 shadow-md lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Pipeline distribution</CardTitle>
                <CardDescription>
                  Kanban columns map to live counts in your database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineEntries.map(([key, count]) => (
                      <TableRow key={key} className="border-border/60">
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

        <TabsContent value="bio" className="mt-6 outline-none">
          <Card className="border-border/70 bg-card/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Skill engine depth</CardTitle>
              <CardDescription>
                Structured rows in{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  master_skills
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  projects
                </code>
                , and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  experience_blocks
                </code>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Vault messages</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                  {stats.bioMessagesCount}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Chat-style intake in{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                    bio_vault_messages
                  </code>
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Structured atoms</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                  {stats.skillsCount + stats.projectsCount + stats.experienceCount}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Feeds tailored resumes and JD gap analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="mt-6 outline-none">
          <Card className="border-border/70 bg-card/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Relationship graph</CardTitle>
              <CardDescription>
                Contacts and referral paths toward target roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                  {stats.contactsCount}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Referral mappings
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                  {stats.referralLinksCount}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Rows in{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                    contact_job_referrals
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
