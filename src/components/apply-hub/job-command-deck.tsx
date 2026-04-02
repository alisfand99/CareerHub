import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  Heart,
  Layers,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import type { JobRow } from "@/lib/queries/jobs";
import {
  jobPipelineProgress,
  jobStatusRank,
  parseJobIntel,
} from "@/lib/job-detail-parse";
import { cn } from "@/lib/utils";

const DECK =
  "rounded-3xl border border-fuchsia-500/25 bg-[#0a0a0c] p-4 text-zinc-100 shadow-[0_0_40px_-8px_rgba(192,38,211,0.35)] md:p-6";
const PANEL =
  "rounded-2xl border border-fuchsia-500/20 bg-zinc-950/80 p-4 shadow-[inset_0_1px_0_0_rgba(232,121,249,0.08)]";

function GlowBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-fuchsia-500/20",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.55)] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MatchDonut({ percent }: { percent: number | null }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const p = percent == null ? 0 : Math.min(100, Math.max(0, percent));
  const offset = c - (p / 100) * c;
  return (
    <div className="relative mx-auto flex size-36 items-center justify-center">
      <svg className="size-36 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-800"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]"
        />
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[0.65rem] font-medium uppercase tracking-widest text-fuchsia-300/80">
          Match
        </span>
        <span className="text-2xl font-bold tabular-nums text-white">
          {percent == null ? "—" : `${Math.round(p)}%`}
        </span>
      </div>
    </div>
  );
}

function SkillBarsChart({ skills }: { skills: { name: string; filled: boolean }[] }) {
  const slice = skills.slice(0, 8);
  if (slice.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Run JD intelligence in the orchestrator to chart required skills.
      </p>
    );
  }
  const maxH = 112;
  return (
    <div className="flex h-36 items-end justify-center gap-2 px-2 pt-4">
      {slice.map(({ name, filled }) => {
        const h = filled ? maxH : Math.round(maxH * 0.38);
        return (
          <div
            key={name}
            className="flex flex-1 flex-col items-center gap-1"
            title={name}
          >
            <div
              className={cn(
                "w-full max-w-[2.25rem] rounded-t-md shadow-[0_0_14px_rgba(192,38,211,0.35)] transition-all",
                filled
                  ? "bg-gradient-to-t from-fuchsia-700 via-fuchsia-500 to-purple-400"
                  : "bg-gradient-to-t from-zinc-700 to-zinc-600 opacity-80",
              )}
              style={{ height: h }}
            />
            <span className="line-clamp-2 max-w-[4rem] text-center text-[0.6rem] leading-tight text-zinc-500">
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatShortDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const STATUS_LABEL: Record<string, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

export function JobCommandDeck({ job }: { job: JobRow }) {
  const intel = parseJobIntel(job);
  const pipeline = jobPipelineProgress(job.status);
  const rank = jobStatusRank(job.status);
  const match =
    job.ai_match_score != null ? Number(job.ai_match_score) : null;
  const initials = `${(job.company || "?").slice(0, 1)}${(job.title || "?").slice(0, 1)}`.toUpperCase();

  const chartSkills = intel.requiredSkills.map((name) => ({
    name,
    filled: intel.matchedSkills.some(
      (m) => m.toLowerCase() === name.toLowerCase(),
    ),
  }));

  const perkCount = Math.min(5, Math.max(1, intel.matchedSkills.length || 1));

  return (
    <div className={DECK}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/apply-hub"
          className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-zinc-900/80 px-3 py-1.5 text-sm text-fuchsia-200 shadow-[0_0_16px_rgba(192,38,211,0.2)] transition hover:border-fuchsia-400/50 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Apply Hub
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Calendar className="size-3.5 text-fuchsia-400/70" aria-hidden />
          <span>Updated {formatShortDate(job.updated_at)}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Hero / profile */}
        <div className={cn(PANEL, "lg:col-span-5")}>
          <div className="flex gap-4">
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-950 to-zinc-900 text-lg font-bold tracking-tight text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.45)]"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-balance text-xl font-bold leading-tight text-white md:text-2xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-sm text-fuchsia-200/80">{job.company}</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-zinc-300">
                  <Layers className="size-4 shrink-0 text-fuchsia-400" />
                  <span className="text-zinc-500">Track</span>
                  <span className="font-medium text-white">
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Target className="size-4 shrink-0 text-fuchsia-400" />
                  <span className="text-zinc-500">Rank</span>
                  <span className="font-medium text-fuchsia-200">{rank}</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Briefcase className="size-4 shrink-0 text-fuchsia-400" />
                  <span className="text-zinc-500">Job family</span>
                  <span className="truncate font-medium text-white">
                    {intel.jobFamily}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-fuchsia-500/15 pt-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Pipeline stage</span>
                <span className="tabular-nums text-fuchsia-300">{pipeline}%</span>
              </div>
              <GlowBar value={pipeline} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Vault alignment</span>
                <span className="tabular-nums text-fuchsia-300">
                  {match == null ? "—" : `${Math.round(match)}%`}
                </span>
              </div>
              <GlowBar value={match ?? 0} />
            </div>
          </div>
        </div>

        {/* Donut + perks */}
        <div className={cn(PANEL, "flex flex-col lg:col-span-3")}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90">
            Match core
          </h2>
          <MatchDonut percent={match} />
          <p className="mt-3 text-center text-xs text-zinc-500">
            Score from orchestrator vs your Bio-Vault skills.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-fuchsia-500/15 pt-4">
            {Array.from({ length: perkCount }).map((_, i) => (
              <span
                key={i}
                className="flex size-10 items-center justify-center rounded-xl border border-fuchsia-500/25 bg-zinc-900/90 text-fuchsia-300 shadow-[0_0_12px_rgba(192,38,211,0.25)]"
              >
                {i % 3 === 0 ? (
                  <Heart className="size-4" />
                ) : i % 3 === 1 ? (
                  <Star className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Skill tracker */}
        <div className={cn(PANEL, "lg:col-span-4")}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90">
            <TrendingUp className="size-4" aria-hidden />
            Skills to level
          </h2>
          <ul className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {(intel.requiredSkills.length
              ? intel.requiredSkills
              : intel.stretchSkills
            ).length === 0 ? (
              <li className="text-sm text-zinc-500">
                No skill list yet — paste a JD into the orchestrator.
              </li>
            ) : (
              (intel.requiredSkills.length
                ? intel.requiredSkills
                : intel.stretchSkills
              ).map((name) => {
                const acquired = intel.matchedSkills.some(
                  (m) => m.toLowerCase() === name.toLowerCase(),
                );
                const pct = acquired ? 92 : 28;
                return (
                  <li key={name} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-bold",
                        acquired
                          ? "border-fuchsia-400/50 bg-fuchsia-950/50 text-fuchsia-200"
                          : "border-zinc-600 bg-zinc-900 text-zinc-500",
                      )}
                    >
                      {acquired ? "OK" : "++"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {name}
                      </p>
                      <GlowBar value={pct} className="mt-1.5" />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Bar chart */}
        <div className={cn(PANEL, "lg:col-span-6")}>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90">
            Requirement signal
          </h2>
          <p className="mb-2 text-xs text-zinc-500">
            Taller bars = already reflected in your vault.
          </p>
          <SkillBarsChart skills={chartSkills} />
        </div>

        {/* Intel table */}
        <div className={cn(PANEL, "lg:col-span-6")}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90">
            <Shield className="size-4 text-fuchsia-400" aria-hidden />
            Market intel
          </h2>
          {intel.summary ? (
            <p className="mb-3 rounded-xl border border-fuchsia-500/15 bg-zinc-900/50 p-3 text-sm leading-relaxed text-zinc-300">
              {intel.summary}
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-medium">Focus</th>
                  <th className="px-3 py-2 font-medium">Tag</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {intel.marketGaps.length === 0 &&
                intel.missingSkills.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-zinc-500"
                    >
                      No gap rows yet. Ingest a JD to populate insights.
                    </td>
                  </tr>
                ) : (
                  <>
                    {intel.marketGaps.map((g, i) => (
                      <tr
                        key={`g-${g.skill}-${i}`}
                        className="border-b border-zinc-800/80 last:border-0"
                      >
                        <td className="px-3 py-2.5 font-medium text-zinc-200">
                          {g.skill}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-400">
                          {g.label ?? g.kind ?? "Insight"}
                        </td>
                        <td className="px-3 py-2.5 text-fuchsia-300/90">
                          {g.priority ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {intel.marketGaps.length === 0
                      ? intel.missingSkills.map((s) => (
                          <tr
                            key={`m-${s}`}
                            className="border-b border-zinc-800/80 last:border-0"
                          >
                            <td className="px-3 py-2.5 font-medium text-zinc-200">
                              {s}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-400">
                              Skill gap
                            </td>
                            <td className="px-3 py-2.5 text-fuchsia-300/90">
                              high
                            </td>
                          </tr>
                        ))
                      : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* JD */}
        <div className={cn(PANEL, "lg:col-span-12")}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90">
            <BookOpen className="size-4" aria-hidden />
            Job description
          </h2>
          {job.jd_text?.trim() ? (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-400">
              <pre className="whitespace-pre-wrap font-sans">{job.jd_text}</pre>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No JD text stored for this role yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
