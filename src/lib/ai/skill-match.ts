/** Normalize for fuzzy comparison of skill labels */
export function normalizeSkillToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokensOverlap(a: string, b: string): boolean {
  const na = normalizeSkillToken(a);
  const nb = normalizeSkillToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = new Set(na.split(" ").filter((t) => t.length > 1));
  const wb = new Set(nb.split(" ").filter((t) => t.length > 1));
  return Array.from(wa).some((t) => wb.has(t));
}

export function skillMatchesVault(
  requiredLabel: string,
  vaultNames: string[],
): boolean {
  return vaultNames.some((v) => tokensOverlap(requiredLabel, v));
}

export function partitionSkillsAgainstVault(
  required: string[],
  vaultNames: string[],
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const r of required) {
    const key = normalizeSkillToken(r);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (skillMatchesVault(r, vaultNames)) matched.push(r);
    else missing.push(r);
  }
  return { matched, missing };
}

export function matchScorePercent(matched: number, required: number): number {
  if (required <= 0) return 0;
  return Math.round(Math.min(100, (matched / required) * 100));
}
