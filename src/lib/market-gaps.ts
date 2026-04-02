export type MarketGapRow = {
  skill: string;
  jobFamily: string;
  sourceJob: string;
  priority?: string;
};

export function extractMarketGaps(
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
