/**
 * Coerce common Gemini JSON shapes into what OrchestratorPlanSchema expects.
 * Résumé dumps often use `experience: [...]`, alternate keys, or string proficiencies.
 */
const VALID_INTENTS = new Set([
  "job_description",
  "skill_project_update",
  "contact_networking",
  "outreach_generation",
  "general",
]);

function bulletsToStringArray(bullets: unknown): string[] | undefined {
  if (bullets === undefined || bullets === null) return undefined;
  if (Array.isArray(bullets)) {
    return bullets.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  if (typeof bullets === "string") {
    return bullets
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizeExperienceEntry(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const e = { ...(raw as Record<string, unknown>) };
  const b = bulletsToStringArray(e.bullets);
  if (b !== undefined) e.bullets = b;
  if (typeof e.is_current === "string") {
    const s = e.is_current.toLowerCase();
    e.is_current = s === "true" || s === "yes" || s === "current";
  }
  return e;
}

function toStringArray(v: unknown): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return undefined;
}

function wrapIfSingleObject(key: string, o: Record<string, unknown>): void {
  const v = o[key];
  if (v !== undefined && v !== null && typeof v === "object" && !Array.isArray(v)) {
    o[key] = [v];
  }
}

/** Merge alternate experience arrays into a list; mutates `o` (removes alias keys). */
function collectExperiences(o: Record<string, unknown>): unknown[] {
  const out: unknown[] = [];
  const pushUnique = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (item && typeof item === "object") out.push(normalizeExperienceEntry(item));
    }
  };

  pushUnique(o.experiences);

  const exp = o.experience;
  if (Array.isArray(exp)) {
    pushUnique(exp);
    delete o.experience;
  } else if (exp && typeof exp === "object") {
    const ex = exp as Record<string, unknown>;
    if (Array.isArray(ex.roles)) {
      pushUnique(ex.roles);
      delete o.experience;
    } else {
      out.push(normalizeExperienceEntry(exp));
      delete o.experience;
    }
  }

  for (const alt of [
    "work_history",
    "employment_history",
    "employment",
    "work_experience",
    "positions",
    "jobs_history",
  ] as const) {
    if (Array.isArray(o[alt])) {
      pushUnique(o[alt]);
      delete o[alt];
    }
  }

  return out;
}

export function normalizeOrchestratorPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = { ...(raw as Record<string, unknown>) };

  const experiences = collectExperiences(o);
  if (experiences.length > 0) {
    o.experiences = experiences;
  }

  wrapIfSingleObject("education", o);
  wrapIfSingleObject("certifications", o);
  wrapIfSingleObject("languages", o);
  wrapIfSingleObject("projects", o);
  wrapIfSingleObject("skills", o);

  if (typeof o.intent === "string") {
    let intent = o.intent.trim().toLowerCase().replace(/-/g, "_");
    const alias: Record<string, string> = {
      resume: "skill_project_update",
      cv: "skill_project_update",
      resume_ingest: "skill_project_update",
      profile_update: "skill_project_update",
      bio_update: "skill_project_update",
    };
    if (alias[intent]) intent = alias[intent];
    o.intent = VALID_INTENTS.has(intent) ? intent : "general";
  } else {
    o.intent = "general";
  }

  const eduLen = Array.isArray(o.education) ? o.education.length : 0;
  const certLen = Array.isArray(o.certifications) ? o.certifications.length : 0;
  const skillLen = Array.isArray(o.skills) ? o.skills.length : 0;

  if (o.intent === "general") {
    const hasResumeShape =
      experiences.length > 0 ||
      eduLen > 0 ||
      certLen > 0 ||
      skillLen > 4;
    if (hasResumeShape) o.intent = "skill_project_update";
  }

  if (typeof o.assistant_message !== "string" || !o.assistant_message.trim()) {
    o.assistant_message =
      "I pulled structured fields from your text into Bio-Vault where possible. Review the sections on the page.";
  }

  if (Array.isArray(o.skills)) {
    o.skills = o.skills.map((s) => {
      if (!s || typeof s !== "object" || Array.isArray(s)) return s;
      const sk = { ...(s as Record<string, unknown>) };
      const tools = toStringArray(sk.tools);
      if (tools !== undefined) sk.tools = tools;
      if (typeof sk.proficiency === "string") {
        const n = parseFloat(String(sk.proficiency).replace(/[^\d.]/g, ""));
        if (Number.isFinite(n)) sk.proficiency = n;
        else delete sk.proficiency;
      }
      if (typeof sk.proficiency === "number") {
        const n = sk.proficiency;
        if (!Number.isFinite(n) || n < 1 || n > 5) delete sk.proficiency;
      }
      return sk;
    });
  }

  if (Array.isArray(o.projects)) {
    o.projects = o.projects.map((p) => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return p;
      const pr = { ...(p as Record<string, unknown>) };
      const ts = toStringArray(pr.tech_stack);
      if (ts !== undefined) pr.tech_stack = ts;
      return pr;
    });
  }

  if (o.outreach && typeof o.outreach === "object" && !Array.isArray(o.outreach)) {
    const ou = o.outreach as Record<string, unknown>;
    if (!ou.draft_message && typeof ou.message === "string") {
      ou.draft_message = ou.message;
    }
  }

  if (o.contact && typeof o.contact === "object" && !Array.isArray(o.contact)) {
    const c = o.contact as Record<string, unknown>;
    if (!c.full_name && typeof c.name === "string") c.full_name = c.name;
  }

  if (o.job && typeof o.job === "object" && !Array.isArray(o.job)) {
    const j = o.job as Record<string, unknown>;
    const arr = toStringArray(j.required_skills);
    if (arr !== undefined) j.required_skills = arr;
  }

  return o;
}
