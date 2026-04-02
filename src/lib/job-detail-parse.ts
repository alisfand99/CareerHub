import type { JobRow } from "@/lib/queries/jobs";

export type MarketGapItem = {
  skill: string;
  priority?: string;
  label?: string;
  kind?: string;
};

export type ParsedJobIntel = {
  jobFamily: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  stretchSkills: string[];
  marketGaps: MarketGapItem[];
  summary: string | null;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function missingSkillNames(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      if (item.trim()) out.push(item.trim());
      continue;
    }
    if (item && typeof item === "object" && "skill" in item) {
      const s = (item as { skill?: string }).skill;
      if (typeof s === "string" && s.trim()) out.push(s.trim());
    }
  }
  return out;
}

function parseMarketGaps(v: unknown): MarketGapItem[] {
  if (!Array.isArray(v)) return [];
  const out: MarketGapItem[] = [];
  for (const g of v) {
    if (!g || typeof g !== "object") continue;
    const o = g as Record<string, unknown>;
    const skill = o.skill;
    if (typeof skill !== "string" || !skill.trim()) continue;
    out.push({
      skill: skill.trim(),
      priority: typeof o.priority === "string" ? o.priority : undefined,
      label: typeof o.label === "string" ? o.label : undefined,
      kind: typeof o.kind === "string" ? o.kind : undefined,
    });
  }
  return out;
}

export function parseJobIntel(job: JobRow): ParsedJobIntel {
  const gap =
    job.ai_gap_analysis && typeof job.ai_gap_analysis === "object"
      ? (job.ai_gap_analysis as Record<string, unknown>)
      : null;
  const ins =
    job.ai_insights && typeof job.ai_insights === "object"
      ? (job.ai_insights as Record<string, unknown>)
      : null;

  const fromGapRequired = gap ? asStringArray(gap.required_skills) : [];
  const fromGapMatched = gap ? asStringArray(gap.matched_skills) : [];
  const fromGapMissingObjects = gap ? missingSkillNames(gap.missing_skills) : [];

  const fromInsMatched = ins ? asStringArray(ins.matched_skills) : [];
  const marketGaps = ins ? parseMarketGaps(ins.market_gaps) : [];
  const summary =
    ins && typeof ins.summary === "string" && ins.summary.trim()
      ? ins.summary.trim()
      : null;

  const jobFamily =
    (gap && typeof gap.job_family === "string" && gap.job_family) ||
    (ins && typeof ins.job_family === "string" && ins.job_family) ||
    "General";

  const stretch = asStringArray(job.ai_stretch_skills);

  const matchedSet = new Set(
    [...fromGapMatched, ...fromInsMatched].map((s) => s.toLowerCase()),
  );

  let requiredSkills = fromGapRequired;
  if (requiredSkills.length === 0) {
    requiredSkills = Array.from(
      new Set([...fromGapMatched, ...fromInsMatched, ...stretch]),
    );
  }
  if (requiredSkills.length === 0 && stretch.length > 0) {
    requiredSkills = [...stretch];
  }

  const matchedSkills = requiredSkills.filter((s) =>
    matchedSet.has(s.toLowerCase()),
  );
  const missingSkills =
    fromGapMissingObjects.length > 0
      ? fromGapMissingObjects
      : requiredSkills.filter((s) => !matchedSet.has(s.toLowerCase()));

  return {
    jobFamily,
    requiredSkills,
    matchedSkills,
    missingSkills,
    stretchSkills: stretch,
    marketGaps,
    summary,
  };
}

const STATUS_RANK: Record<string, string> = {
  wishlist: "Scout",
  applied: "Challenger",
  interview: "Elite",
  offer: "Champion",
};

const STATUS_PROGRESS: Record<string, number> = {
  wishlist: 25,
  applied: 50,
  interview: 75,
  offer: 100,
};

export function jobStatusRank(status: string): string {
  return STATUS_RANK[status] ?? "Operative";
}

export function jobPipelineProgress(status: string): number {
  return STATUS_PROGRESS[status] ?? 20;
}
