"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  Briefcase,
  Loader2,
  MapPin,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AddJobDialog } from "@/components/dashboard/dashboard-manual-forms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import type { JobRow } from "@/lib/queries/jobs";

const STATUSES = ["wishlist", "applied", "interview", "offer"] as const;
type JobStatus = (typeof STATUSES)[number];

const labels: Record<(typeof STATUSES)[number], string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

const LOGO_PALETTES = [
  "bg-cyan-100 text-cyan-900",
  "bg-violet-100 text-violet-900",
  "bg-fuchsia-100 text-fuchsia-900",
  "bg-sky-100 text-sky-900",
  "bg-teal-100 text-teal-900",
  "bg-indigo-100 text-indigo-900",
] as const;

function companyMark(company: string): { letter: string; palette: string } {
  const t = company.trim();
  const letter = t ? t.slice(0, 1).toUpperCase() : "?";
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h + t.charCodeAt(i) * (i + 1)) % 997;
  const palette = LOGO_PALETTES[h % LOGO_PALETTES.length];
  return { letter, palette };
}

function MatchDonutOverview({
  avgPct,
  highBandCount,
  totalScored,
  totalJobs,
  className,
}: {
  avgPct: number;
  highBandCount: number;
  totalScored: number;
  totalJobs: number;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, avgPct));
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const successRate =
    totalScored > 0
      ? Math.round((highBandCount / totalScored) * 100)
      : 0;

  return (
    <div className={cn("flex min-h-0 w-full min-w-0 flex-col font-sans", className)}>
      <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-900 sm:tracking-[0.2em]">
        Match percentage overview
      </h3>

      <div className="relative mx-auto mt-4 flex aspect-square w-[min(100%,200px)] max-w-full shrink-0 items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#f5d0fe"
            strokeWidth="11"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={`url(#donut-${gid})`}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
          />
          <defs>
            <linearGradient id={`donut-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#c026d3" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
            {avgPct.toFixed(1)}%
          </span>
        </div>
      </div>

      <dl className="mt-5 w-full border-t border-slate-200 text-sm">
        <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0 border-b border-slate-200 py-2.5">
          <dt className="min-w-0 text-slate-600">Average match</dt>
          <dd className="shrink-0 text-right tabular-nums font-semibold text-slate-900">
            {totalScored > 0 ? Math.round(avgPct) : "—"}
          </dd>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0 border-b border-slate-200 py-2.5">
          <dt className="min-w-0 text-slate-600">Open positions</dt>
          <dd className="shrink-0 text-right tabular-nums font-semibold text-slate-900">
            {totalJobs}
          </dd>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0 py-2.5">
          <dt className="min-w-0 text-slate-600">Success rate</dt>
          <dd className="shrink-0 text-right">
            {totalScored > 0 ? (
              <span className="inline-block rounded-md bg-fuchsia-200/90 px-2.5 py-1 text-xs font-bold tabular-nums text-fuchsia-950 whitespace-nowrap">
                {successRate}%
              </span>
            ) : (
              <span className="font-semibold text-slate-400">—</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function JobKanbanCard({
  job,
  deleting,
  onRemove,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  job: JobRow;
  deleting: boolean;
  onRemove: () => void;
  onDragStart: (jobId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const score =
    job.ai_match_score != null ? Number(job.ai_match_score) : null;
  const pct = score != null ? Math.min(100, Math.max(0, score)) : 0;
  const { letter, palette } = companyMark(job.company ?? "");

  const companyLine = (job.company ?? "").trim() || "—";

  return (
    <li
      className={cn(
        "group relative list-none",
        isDragging && "opacity-45",
      )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", job.id);
        onDragStart(job.id);
      }}
      onDragEnd={onDragEnd}
    >
      <Link
        href={`/apply-hub/jobs/${job.id}`}
        className="block w-full max-w-full rounded-xl border border-slate-100 bg-white p-4 pr-10 shadow-sm outline-none ring-offset-white transition-all hover:border-slate-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-500"
        title={`${job.title} — ${companyLine}`}
      >
        <div className="flex gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
              palette,
            )}
            aria-hidden
          >
            {letter}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900">
              {job.title}
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs leading-none text-slate-600">
              <MapPin
                className="size-3 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="min-w-0 truncate">{companyLine}</span>
            </p>
            <div className="mt-3">
              {score != null ? (
                <>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Match %
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-800">
                      {Math.round(pct)}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-[0.7rem] leading-relaxed text-slate-600">
                  Use the assistant for a match score.
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label={`Remove ${job.title}`}
        disabled={deleting}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        {deleting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-3.5 text-slate-500" aria-hidden />
        )}
      </Button>
    </li>
  );
}

export function ApplyHubBoard({ initialJobs }: { initialJobs: JobRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { busy } = useOrchestrator();
  const onApplyHub = pathname.startsWith("/apply-hub");
  const showPipelinePulse = busy && onApplyHub;
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<JobStatus | null>(null);

  const { avgPct, highBandCount, totalScored } = useMemo(() => {
    const scored = jobs.filter((j) => j.ai_match_score != null);
    const nums = scored.map((j) => Number(j.ai_match_score));
    const avg =
      nums.length > 0
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
    const high = nums.filter((n) => n >= 89).length;
    return {
      avgPct: avg,
      highBandCount: high,
      totalScored: scored.length,
    };
  }, [jobs]);

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
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } finally {
      setDeletingId(null);
    }
  }

  async function moveJobToStatus(jobId: string, targetStatus: JobStatus) {
    const source = jobs.find((j) => j.id === jobId);
    if (!source || source.status === targetStatus) return;

    const previousJobs = jobs;
    const optimistic = previousJobs.map((j) =>
      j.id === jobId ? { ...j, status: targetStatus } : j,
    );
    setJobs(optimistic);

    const supabase = createClient();
    const { error } = await supabase
      .from("jobs")
      .update({ status: targetStatus })
      .eq("id", jobId);

    if (error) {
      setJobs(previousJobs);
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  const byStatus = STATUSES.map((s) => ({
    status: s,
    jobs: jobs.filter((j) => j.status === s),
  }));

  const gridBoardStyle = {
    backgroundImage: `
      linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
    `,
    backgroundSize: "20px 20px",
  } as const;

  return (
    <div className="w-full max-w-none space-y-6 pb-4 font-sans md:space-y-8">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 md:text-3xl">
          Apply Hub
        </h1>
        <p className="font-serif text-lg font-medium text-slate-800 md:text-xl">
          Pipeline · posting insights
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-700 md:text-[0.95rem]">
          کارت‌ها را بین ستون‌ها بکشید و رها کنید تا وضعیت فرصت‌ها سریع
          به‌روزرسانی شود. روی هر کارت کلیک کنید تا جزئیات کامل آن را ببینید.
        </p>
      </header>

      <div className="w-full border-y border-slate-200/90 bg-white shadow-sm">
        <div className="flex min-h-[min(68vh,760px)] w-full min-w-0 flex-col lg:flex-row lg:items-stretch">
          <div
            className="min-w-0 flex-1 lg:min-w-0 lg:basis-0 lg:flex-[3]"
            style={gridBoardStyle}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-3 py-3 backdrop-blur-sm sm:px-5">
              <h2 className="max-w-[85%] text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-900 sm:tracking-[0.18em]">
                Active job pipeline
              </h2>
              <AddJobDialog promoTrigger />
            </div>

            <div className="w-full min-w-0 p-3 sm:p-4 md:p-5">
              <div className="-mx-1 overflow-x-auto px-1 pb-2 [-webkit-overflow-scrolling:touch] lg:mx-0 lg:overflow-x-auto lg:px-0 lg:pb-0">
                <div
                  className={cn(
                    "relative flex w-max min-w-full gap-4 lg:grid lg:w-full lg:min-w-0 lg:gap-4 lg:[grid-template-columns:repeat(4,minmax(240px,1fr))]",
                    showPipelinePulse && "min-h-[200px]",
                  )}
                >
                  {showPipelinePulse ? (
                    <div
                      className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-white/75 pt-12 backdrop-blur-[1px]"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <div className="flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-900 shadow-md">
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Updating your pipeline…
                      </div>
                    </div>
                  ) : null}

                  {byStatus.map(({ status, jobs }) => (
                    <div
                      key={status}
                      className={cn(
                        "flex w-[min(90vw,320px)] shrink-0 flex-col rounded-xl border border-slate-100 bg-white/95 p-3 shadow-sm",
                        "min-h-[260px] sm:min-h-[280px]",
                        "lg:w-auto lg:min-w-0 lg:max-w-none",
                        dropStatus === status &&
                          "border-cyan-300 bg-cyan-50/40 ring-2 ring-cyan-200/70 ring-offset-1 ring-offset-white",
                        showPipelinePulse &&
                          "ring-2 ring-cyan-200/90 ring-offset-1 ring-offset-white",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dropStatus !== status) setDropStatus(status);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedId =
                          e.dataTransfer.getData("text/plain") || draggedJobId;
                        setDropStatus(null);
                        setDraggedJobId(null);
                        if (droppedId) {
                          void moveJobToStatus(droppedId, status);
                        }
                      }}
                      onDragLeave={(e) => {
                        const next = e.relatedTarget as Node | null;
                        if (!next || !e.currentTarget.contains(next)) {
                          setDropStatus((current) =>
                            current === status ? null : current,
                          );
                        }
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <h3 className="min-w-0 text-[0.8125rem] font-semibold text-slate-900">
                          <span className="whitespace-nowrap">
                            {labels[status]}{" "}
                            <span className="font-medium text-slate-500">
                              ({jobs.length})
                            </span>
                          </span>
                        </h3>
                        <span className="shrink-0 text-slate-300" aria-hidden>
                          <MoreHorizontal className="size-4" />
                        </span>
                      </div>
                      <ul className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden">
                        {jobs.map((job) => (
                          <JobKanbanCard
                            key={job.id}
                            job={job}
                            deleting={deletingId === job.id}
                            onRemove={() => void removeJob(job.id, job.title)}
                            onDragStart={setDraggedJobId}
                            onDragEnd={() => {
                              setDraggedJobId(null);
                              setDropStatus(null);
                            }}
                            isDragging={draggedJobId === job.id}
                          />
                        ))}
                        {jobs.length === 0 ? (
                          <li className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/90 py-10 text-center">
                            <Briefcase
                              className="mb-2 size-7 text-slate-300"
                              aria-hidden
                            />
                            <span className="text-xs font-medium text-slate-600">
                              No roles here yet.
                            </span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full min-w-0 shrink-0 border-t border-slate-100 bg-slate-50/70 p-4 lg:max-w-[300px] lg:basis-0 lg:flex-[0.92] lg:border-l lg:border-t-0 lg:p-4">
            <MatchDonutOverview
              avgPct={avgPct}
              highBandCount={highBandCount}
              totalScored={totalScored}
              totalJobs={jobs.length}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
