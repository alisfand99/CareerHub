/**
 * Loose company equality for matching job postings to contact employers.
 */
export function normalizeCompanyForMatch(input: string | null | undefined): string {
  if (!input?.trim()) return "";
  let t = input.trim().toLowerCase();
  t = t.replace(/\s+/g, " ");
  t = t.replace(
    /\b(incorporated|inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|company|co\.|plc\.?|gmbh|s\.a\.|s\.p\.a\.)\b/gi,
    " ",
  );
  t = t.replace(/[^a-z0-9\u0600-\u06FF]+/g, "");
  return t.trim();
}

export function companiesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = normalizeCompanyForMatch(a);
  const nb = normalizeCompanyForMatch(b);
  if (!na || !nb) return false;
  return na === nb;
}
