import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  emptyDashboardStats,
  getDashboardStats,
} from "@/lib/queries/dashboard-stats";
import { DashboardTourDialog } from "@/components/dashboard/dashboard-tour-dialog";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Command center
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Dynamic career intelligence across applications, your skill vault,
            and strategic relationships.
          </p>
        </div>
        <DashboardTourDialog />
      </div>

      {!configured ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
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

      {configured && loadError ? (
        <Card className="border-destructive/40 bg-destructive/5">
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
        <Card>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Apply Hub</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.jobsTotal}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Roles tracked across your pipeline
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Bio-Vault</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.skillsCount + stats.projectsCount + stats.experienceCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary">{stats.skillsCount} skills</Badge>
            <Badge variant="secondary">{stats.projectsCount} projects</Badge>
            <Badge variant="secondary">{stats.experienceCount} roles</Badge>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Network CRM</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.contactsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Avg strength{" "}
            <span className="font-medium text-foreground">
              {stats.avgRelationship != null
                ? stats.avgRelationship.toFixed(1)
                : "—"}{" "}
              / 5
            </span>
            {stats.referralLinksCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">
                  {stats.referralLinksCount}
                </span>{" "}
                referral links
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="apply" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="bio">Bio-Vault</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline distribution</CardTitle>
              <CardDescription>
                Kanban columns map to live counts in{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">jobs</code>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    Object.entries(stats.jobsByStatus) as [
                      keyof typeof stats.jobsByStatus,
                      number,
                    ][]
                  ).map(([key, count]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {jobLabels[key] ?? key}
                          <Badge variant="outline" className="text-xs">
                            {key}
                          </Badge>
                        </div>
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
        </TabsContent>
        <TabsContent value="bio" className="mt-4">
          <Card>
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
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-sm text-muted-foreground">Vault messages</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.bioMessagesCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chat-style intake in{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                    bio_vault_messages
                  </code>
                </p>
              </div>
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-sm text-muted-foreground">Structured atoms</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.skillsCount + stats.projectsCount + stats.experienceCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Feeds tailored resumes and JD gap analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="network" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relationship graph</CardTitle>
              <CardDescription>
                Contacts and referral paths toward target roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.contactsCount}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-sm text-muted-foreground">
                  Referral mappings
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stats.referralLinksCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
