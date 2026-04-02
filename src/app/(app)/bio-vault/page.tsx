import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SkillRow = {
  id: string;
  name: string;
  category: string | null;
  proficiency: number | null;
  tools: string[] | null;
  evidence: string | null;
  metadata: Record<string, unknown> | null;
};

type MarketGapRow = {
  skill: string;
  jobFamily: string;
  sourceJob: string;
  priority?: string;
};

function extractMarketGaps(
  jobs: {
    title: string;
    company: string;
    ai_insights: unknown;
  }[],
): MarketGapRow[] {
  const out: MarketGapRow[] = [];
  for (const j of jobs) {
    const ins = j.ai_insights as Record<string, unknown> | null;
    if (!ins || typeof ins !== "object") continue;
    const jobFamily =
      typeof ins.job_family === "string" ? ins.job_family : "General";
    const gaps = ins.market_gaps;
    if (!Array.isArray(gaps)) continue;
    for (const g of gaps) {
      if (!g || typeof g !== "object") continue;
      const skill = (g as { skill?: string }).skill;
      if (!skill) continue;
      out.push({
        skill,
        jobFamily,
        sourceJob: `${j.title} @ ${j.company}`,
        priority:
          typeof (g as { priority?: string }).priority === "string"
            ? (g as { priority: string }).priority
            : undefined,
      });
    }
  }
  return out;
}

export default async function BioVaultPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Bio-Vault</h1>
        <p className="text-sm text-muted-foreground">
          Configure Supabase to load your skill vault and market insights.
        </p>
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
          Sign in to view acquired skills and growth roadmap items.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const { data: skillRows } = await supabase
    .from("master_skills")
    .select("id, name, category, proficiency, tools, evidence, metadata")
    .eq("user_id", user.id)
    .order("name");

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("title, company, ai_insights")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: resumeMsg } = await supabase
    .from("bio_vault_messages")
    .select("metadata, created_at")
    .eq("user_id", user.id)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(25);

  const skills = (skillRows ?? []) as SkillRow[];
  const marketGaps = extractMarketGaps(jobRows ?? []);

  const latestResume = resumeMsg?.find(
    (m) =>
      m.metadata &&
      typeof m.metadata === "object" &&
      (m.metadata as { type?: string }).type === "resume_refactor",
  );

  const resumeMd =
    latestResume &&
    typeof latestResume.metadata === "object" &&
    typeof (latestResume.metadata as { markdown?: string }).markdown ===
      "string"
      ? (latestResume.metadata as { markdown: string }).markdown
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bio-Vault</h1>
        <p className="text-sm text-muted-foreground">
          Acquired evidence in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            master_skills
          </code>{" "}
          versus market-demanded capabilities inferred from JDs (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            jobs.ai_insights
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">metadata</code>{" "}
          tags per skill).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Acquired skills</CardTitle>
            <CardDescription>
              Your vault — tagged via{" "}
              <span className="text-foreground">metadata.origin</span> (
              <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                acquired
              </code>
              ).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No skills yet. Tell the orchestrator about your stack and wins.
              </p>
            ) : (
              <ul className="space-y-2">
                {skills.map((s) => {
                  const meta = s.metadata as { origin?: string } | null;
                  const origin = meta?.origin ?? "acquired";
                  return (
                    <li
                      key={s.id}
                      className="rounded-lg border border-border/70 bg-card/60 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {s.category ? (
                          <Badge variant="outline" className="text-xs">
                            {s.category}
                          </Badge>
                        ) : null}
                        <Badge variant="secondary" className="text-xs">
                          {origin}
                        </Badge>
                        {s.proficiency != null ? (
                          <span className="text-xs text-muted-foreground">
                            L{s.proficiency}/5
                          </span>
                        ) : null}
                      </div>
                      {s.tools && s.tools.length > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.tools.join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Market insights</CardTitle>
            <CardDescription>
              Gaps surfaced when JDs are ingested — indexed by job family for
              your personal growth roadmap (
              <span className="text-foreground">market_demand</span>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Paste a job description into the orchestrator to populate gap
                analysis and see what the market is asking for next.
              </p>
            ) : (
              <ul className="space-y-2">
                {marketGaps.map((g, i) => (
                  <li
                    key={`${g.skill}-${i}`}
                    className="rounded-lg border border-primary/15 bg-background/80 px-3 py-2"
                  >
                    <p className="font-medium text-foreground">{g.skill}</p>
                    <p className="text-xs text-muted-foreground">
                      Job family:{" "}
                      <span className="text-foreground">{g.jobFamily}</span>
                      {g.priority ? (
                        <>
                          {" "}
                          · Priority:{" "}
                          <span className="text-foreground">{g.priority}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      From {g.sourceJob}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Living resume snapshot</CardTitle>
          <CardDescription>
            Latest orchestrator refactor (stored on assistant{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
              bio_vault_messages.metadata
            </code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resumeMd ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-border/70 bg-muted/30 p-4 text-xs leading-relaxed">
              {resumeMd}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chat about projects or skills — when the model returns{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                resume_refactor_markdown
              </code>
              , it will appear here for one-click export workflows (next:
              PDF/Markdown download).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
