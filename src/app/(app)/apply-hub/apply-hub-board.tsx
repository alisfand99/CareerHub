"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Briefcase, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AddJobDialog } from "@/components/dashboard/dashboard-manual-forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import type { JobRow } from "@/lib/queries/jobs";

const STATUSES = ["wishlist", "applied", "interview", "offer"] as const;

const labels: Record<(typeof STATUSES)[number], string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

function MatchGauge({ score }: { score: number }) {
  const gid = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, score));
  const r = 17;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div
      className="relative flex items-center gap-3"
      style={{ letterSpacing: "-0.02em" }}
    >
      <div className="relative size-11 shrink-0">
        <svg className="size-11 -rotate-90" viewBox="0 0 44 44" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-primary/15"
          />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            className="drop-shadow-[0_0_10px_rgba(0,86,210,0.45)]"
          />
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0056d2" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold tabular-nums text-foreground">
          {Math.round(pct)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          Match
        </p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-primary/10 shadow-[inset_0_0_0_1px_rgba(0,86,210,0.12)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500/90 to-primary shadow-[0_0_12px_rgba(0,86,210,0.35)] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ApplyHubBoard({ initialJobs }: { initialJobs: JobRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { busy } = useOrchestrator();
  const onApplyHub = pathname.startsWith("/apply-hub");
  const showPipelinePulse = busy && onApplyHub;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeJob(jobId: string, title: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove “${title}” from your pipeline?`)
    ) {
      return;
    }
    setDeletingId(jobId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) {
        window.alert(error.message);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const byStatus = STATUSES.map((s) => ({
    status: s,
    jobs: initialJobs.filter((j) => j.status === s),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Apply Hub</h1>
          <p className="text-sm text-muted-foreground">
            Track roles from wishlist to offer. Add a posting with the career
            assistant to see match scores and market insights in Bio-Vault.
          </p>
        </div>
        <AddJobDialog />
      </div>

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
          showPipelinePulse && "relative",
        )}
      >
        {showPipelinePulse ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-background/40 pt-8 backdrop-blur-[2px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-4 py-2 text-sm font-medium text-primary shadow-lg">
              <Loader2 className="size-4 animate-spin" />
              Updating your pipeline…
            </div>
          </div>
        ) : null}

        {byStatus.map(({ status, jobs }) => (
          <div
            key={status}
            className={cn(
              "flex min-h-[280px] flex-col rounded-xl border border-border/80 bg-card/40 p-3 shadow-sm transition-shadow",
              showPipelinePulse && "ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2">
              <h2 className="text-sm font-semibold tracking-tight">
                {labels[status]}
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {jobs.length}
              </Badge>
            </div>
            <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {jobs.map((job) => (
                <li key={job.id} className="flex gap-1">
                  <Link
                    href={`/apply-hub/jobs/${job.id}`}
                    className="min-w-0 flex-1 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Card className="h-full border-border/70 bg-background/80 shadow-none transition-colors hover:border-primary/35 hover:bg-background">
                      <CardHeader className="space-y-1 p-3 pb-2">
                        <CardTitle className="text-sm leading-snug">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {job.company}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {job.ai_match_score != null ? (
                          <MatchGauge score={Number(job.ai_match_score)} />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Open the assistant to analyze this posting.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="mt-1 shrink-0 self-start text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${job.title}`}
                    disabled={deletingId === job.id}
                    onClick={() => void removeJob(job.id, job.title)}
                  >
                    {deletingId === job.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                  </Button>
                </li>
              ))}
              {jobs.length === 0 ? (
                <li className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-8 text-center text-xs text-muted-foreground">
                  <Briefcase className="mb-2 size-8 opacity-30" />
                  No roles here yet.
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
