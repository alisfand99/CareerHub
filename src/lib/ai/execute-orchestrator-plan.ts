import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/ai/env";
import { generateContentWithModelFallback } from "@/lib/ai/gemini-run";
import {
  matchScorePercent,
  partitionSkillsAgainstVault,
} from "@/lib/ai/skill-match";
import type { OrchestratorPlan } from "@/lib/ai/orchestrator-schema";
import type { OrchestratorDelta } from "@/types/orchestrator";

export type OrchestratorExecutionResult = {
  ok: boolean;
  intent: string;
  assistant_message: string;
  updated_tables: string[];
  insights?: Record<string, unknown>;
  record_ids?: Record<string, string>;
  outreach?: { message: string; format?: string };
  delta?: OrchestratorDelta;
};

function parseIsoDate(s: string | undefined): string | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function experienceBlockCount(plan: OrchestratorPlan): number {
  const fromList =
    plan.experiences?.filter((e) => e.title?.trim()).length ?? 0;
  if (fromList > 0) return fromList;
  return plan.experience?.title?.trim() ? 1 : 0;
}

function computeDelta(
  plan: OrchestratorPlan,
  updated_tables: string[],
  outreach?: { message?: string },
): OrchestratorDelta | undefined {
  const d: OrchestratorDelta = {};
  let any = false;
  if (updated_tables.includes("jobs")) {
    d.pipelineJobs = 1;
    any = true;
  }
  if (updated_tables.includes("master_skills") && plan.skills?.length) {
    d.skillsIndexed = plan.skills.length;
    any = true;
  }
  if (updated_tables.includes("experience_blocks")) {
    d.experienceBlocks = experienceBlockCount(plan) || 1;
    any = true;
  }
  if (updated_tables.includes("contacts")) {
    d.contacts = 1;
    any = true;
  }
  if (
    updated_tables.includes("bio_vault_messages") &&
    plan.resume_refactor_markdown?.trim()
  ) {
    d.bioVaultLogs = 1;
    any = true;
  }
  if (updated_tables.includes("profiles")) {
    d.profileUpdated = true;
    any = true;
  }
  if (updated_tables.includes("education_entries") && plan.education?.length) {
    d.educationAdded = plan.education.length;
    any = true;
  }
  if (
    updated_tables.includes("certification_entries") &&
    plan.certifications?.length
  ) {
    d.certificationsAdded = plan.certifications.length;
    any = true;
  }
  if (updated_tables.includes("language_entries") && plan.languages?.length) {
    d.languagesAdded = plan.languages.length;
    any = true;
  }
  if (updated_tables.includes("projects") && plan.projects?.length) {
    d.projectsAdded = plan.projects.length;
    any = true;
  }
  if (plan.intent === "outreach_generation" && outreach?.message) {
    d.outreachDraft = true;
    any = true;
  }
  return any ? d : undefined;
}

async function logBioVault(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("bio_vault_messages").insert({
    user_id: userId,
    role,
    content,
    metadata,
  });
}

async function findJobForOutreach(
  supabase: SupabaseClient,
  userId: string,
  company: string,
  role: string,
): Promise<{ id: string; jd_text: string | null; title: string; company: string } | null> {
  const c = company.trim().toLowerCase();
  const r = role.trim().toLowerCase();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, jd_text, title, company")
    .eq("user_id", userId);

  if (!jobs?.length) return null;

  const scored = jobs
    .map((j) => {
      const jc = j.company.toLowerCase();
      const jt = j.title.toLowerCase();
      let score = 0;
      if (c && jc.includes(c)) score += 3;
      if (c && c.includes(jc.slice(0, 4))) score += 1;
      if (r && jt.includes(r)) score += 3;
      if (r && r.split(" ").some((w) => w.length > 3 && jt.includes(w)))
        score += 1;
      return { j, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.j ?? null;
}

async function refineOutreachWithJd(input: {
  draft: string;
  jdText: string | null;
  topSkills: string[];
  company: string;
  role: string;
}): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) return input.draft;

  const genAI = new GoogleGenerativeAI(key);

  const prompt = `You are a technical talent agent. Polish this outreach for ${input.role} at ${input.company}.
Use the JD excerpt to align language with their stack and priorities.
Weave in 1–2 of the candidate's strengths: ${input.topSkills.join(", ")}.
Keep it under 220 words, high signal, no clichés, no fake claims.

DRAFT:
${input.draft}

JD (may be partial):
${input.jdText ?? "(not available)"}

Reply with ONLY the final message text.`;

  const res = await generateContentWithModelFallback(
    genAI,
    { generationConfig: { temperature: 0.35, maxOutputTokens: 2048 } },
    prompt,
  );
  return res.response.text().trim() || input.draft;
}

export async function executeOrchestratorPlan(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  plan: OrchestratorPlan,
): Promise<OrchestratorExecutionResult> {
  const updated_tables: string[] = [];
  const record_ids: Record<string, string> = {};
  let insights: Record<string, unknown> | undefined;
  let outreach: OrchestratorExecutionResult["outreach"];

  await logBioVault(supabase, userId, "user", userMessage, {
    source: "orchestrator",
  });

  const { data: skillRows } = await supabase
    .from("master_skills")
    .select("name, proficiency")
    .eq("user_id", userId);

  const vaultNames = skillRows?.map((s) => s.name) ?? [];

  try {
    switch (plan.intent) {
      case "job_description": {
        if (!plan.job?.title || !plan.job?.company) {
          await logBioVault(
            supabase,
            userId,
            "assistant",
            plan.assistant_message,
            { intent: plan.intent, error: "missing_job_fields" },
          );
          return {
            ok: false,
            intent: plan.intent,
            assistant_message:
              plan.assistant_message ||
              "I need a clearer job title and company to save this role.",
            updated_tables,
            insights: undefined,
            record_ids,
          };
        }

        const required = plan.job.required_skills ?? [];
        const { matched, missing } = partitionSkillsAgainstVault(
          required,
          vaultNames,
        );
        const score = matchScorePercent(matched.length, required.length || 1);

        const job_family =
          plan.job.job_family ?? "General / see JD";

        const { data: inserted, error } = await supabase
          .from("jobs")
          .insert({
            user_id: userId,
            title: plan.job.title.trim(),
            company: plan.job.company.trim(),
            status: "wishlist",
            jd_text: plan.job.jd_text ?? userMessage,
            ai_match_score: score,
            ai_stretch_skills: missing,
            ai_gap_analysis: {
              missing_skills: missing.map((skill) => ({
                skill,
                kind: "market_demand",
                job_family,
              })),
              matched_skills: matched,
              required_skills: required,
              job_family,
              source: "orchestrator",
            },
            ai_insights: {
              job_family,
              market_gaps: missing.map((skill) => ({
                skill,
                priority: "high",
                kind: "market_demand",
                label: "Market insight",
              })),
              matched_skills: matched,
              summary: `${missing.length} capability gaps vs your vault — prioritize these for marketability.`,
            },
          })
          .select("id")
          .single();

        if (error) throw error;
        updated_tables.push("jobs");
        if (inserted?.id) record_ids.job_id = inserted.id;

        insights = {
          job_id: inserted?.id,
          job_family,
          missing_skills: missing,
          matched_skills: matched,
          match_score: score,
        };
        break;
      }

      case "skill_project_update": {
        if (plan.skills?.length) {
          for (const s of plan.skills) {
            const name = s.name.trim();
            if (!name) continue;

            const { data: hit } = await supabase
              .from("master_skills")
              .select("id")
              .eq("user_id", userId)
              .ilike("name", name)
              .maybeSingle();

            const metadata = {
              origin: "acquired",
              source: "orchestrator",
              updated_at: new Date().toISOString(),
            };

            if (hit?.id) {
              const { error: upErr } = await supabase
                .from("master_skills")
                .update({
                  category: s.category ?? null,
                  proficiency: s.proficiency ?? null,
                  tools: s.tools ?? [],
                  evidence: s.achievements ?? null,
                  metadata,
                })
                .eq("id", hit.id);
              if (upErr) throw upErr;
            } else {
              const { error: insErr } = await supabase
                .from("master_skills")
                .insert({
                  user_id: userId,
                  name,
                  category: s.category ?? null,
                  proficiency: s.proficiency ?? null,
                  tools: s.tools ?? [],
                  evidence: s.achievements ?? null,
                  metadata,
                });
              if (insErr) throw insErr;
            }
          }
          updated_tables.push("master_skills");
        }

        const experienceItems =
          plan.experiences && plan.experiences.length > 0
            ? plan.experiences.filter((e) => e.title?.trim())
            : plan.experience?.title?.trim()
              ? [plan.experience]
              : [];

        let firstExpId: string | undefined;
        for (const ex of experienceItems) {
          const isCurrent = Boolean(ex.is_current);
          const { data: exp, error } = await supabase
            .from("experience_blocks")
            .insert({
              user_id: userId,
              title: ex.title.trim(),
              organization: ex.organization?.trim() ?? null,
              location: ex.location?.trim() ?? null,
              start_date: parseIsoDate(ex.start_date),
              end_date: isCurrent ? null : parseIsoDate(ex.end_date),
              is_current: isCurrent,
              bullets: ex.bullets ?? [],
              raw_ingest:
                ex.raw_ingest?.trim() ??
                userMessage.slice(0, 8000),
            })
            .select("id")
            .single();
          if (error) throw error;
          if (!updated_tables.includes("experience_blocks")) {
            updated_tables.push("experience_blocks");
          }
          if (exp?.id && !firstExpId) firstExpId = exp.id;
        }
        if (firstExpId) record_ids.experience_id = firstExpId;

        if (plan.profile) {
          const allowed = [
            "display_name",
            "headline",
            "summary",
            "phone",
            "location",
            "website",
            "public_email",
          ] as const;
          const clean: Record<string, string> = {};
          for (const key of allowed) {
            const v = plan.profile[key];
            if (typeof v === "string" && v.trim()) clean[key] = v.trim();
          }
          if (Object.keys(clean).length > 0) {
            const { data: exists } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", userId)
              .maybeSingle();
            if (exists?.id) {
              const { error: pe } = await supabase
                .from("profiles")
                .update(clean)
                .eq("id", userId);
              if (pe) throw pe;
            } else {
              const { error: pi } = await supabase
                .from("profiles")
                .insert({ id: userId, ...clean });
              if (pi) throw pi;
            }
            updated_tables.push("profiles");
          }
        }

        if (plan.education?.length) {
          let eduInserted = 0;
          for (const ed of plan.education) {
            const school = ed.school?.trim();
            if (!school) continue;
            const cur = Boolean(ed.is_current);
            const { error: edErr } = await supabase.from("education_entries").insert({
              user_id: userId,
              school,
              degree: ed.degree?.trim() || null,
              field_of_study: ed.field_of_study?.trim() || null,
              start_date: parseIsoDate(ed.start_date),
              end_date: cur ? null : parseIsoDate(ed.end_date),
              is_current: cur,
              description: ed.description?.trim() || null,
            });
            if (edErr) throw edErr;
            eduInserted += 1;
          }
          if (eduInserted > 0) updated_tables.push("education_entries");
        }

        if (plan.certifications?.length) {
          let certInserted = 0;
          for (const c of plan.certifications) {
            const name = c.name?.trim();
            if (!name) continue;
            const { error: cErr } = await supabase
              .from("certification_entries")
              .insert({
                user_id: userId,
                name,
                issuing_org: c.issuing_org?.trim() || null,
                issue_date: parseIsoDate(c.issue_date),
                expiration_date: parseIsoDate(c.expiration_date),
                credential_url: c.credential_url?.trim() || null,
              });
            if (cErr) throw cErr;
            certInserted += 1;
          }
          if (certInserted > 0) updated_tables.push("certification_entries");
        }

        if (plan.languages?.length) {
          let langInserted = 0;
          for (const lang of plan.languages) {
            const name = lang.name?.trim();
            if (!name) continue;
            const { error: lErr } = await supabase.from("language_entries").insert({
              user_id: userId,
              name,
              proficiency: lang.proficiency?.trim() || null,
            });
            if (lErr) throw lErr;
            langInserted += 1;
          }
          if (langInserted > 0) updated_tables.push("language_entries");
        }

        if (plan.projects?.length) {
          let projInserted = 0;
          for (const pr of plan.projects) {
            const name = pr.name?.trim();
            if (!name) continue;
            const { error: prErr } = await supabase.from("projects").insert({
              user_id: userId,
              name,
              summary: pr.summary?.trim() || null,
              tech_stack: pr.tech_stack ?? [],
              url: pr.url?.trim() || null,
            });
            if (prErr) throw prErr;
            projInserted += 1;
          }
          if (projInserted > 0) updated_tables.push("projects");
        }

        if (plan.resume_refactor_markdown?.trim()) {
          await logBioVault(
            supabase,
            userId,
            "assistant",
            "Resume / profile canonical draft refreshed.",
            {
              type: "resume_refactor",
              markdown: plan.resume_refactor_markdown,
            },
          );
          updated_tables.push("bio_vault_messages");
        }
        break;
      }

      case "contact_networking": {
        if (!plan.contact?.full_name) {
          await logBioVault(
            supabase,
            userId,
            "assistant",
            plan.assistant_message,
            { intent: plan.intent },
          );
          return {
            ok: false,
            intent: plan.intent,
            assistant_message:
              plan.assistant_message ||
              "Share a name (and ideally company or role) so I can file the contact.",
            updated_tables,
          };
        }

        const { data: c, error } = await supabase
          .from("contacts")
          .insert({
            user_id: userId,
            full_name: plan.contact.full_name.trim(),
            company: plan.contact.company ?? null,
            role_title: plan.contact.role_title ?? null,
            email: plan.contact.email ?? null,
            notes: plan.contact.notes ?? null,
            ai_expertise: { source: "orchestrator" },
          })
          .select("id")
          .single();

        if (error) throw error;
        updated_tables.push("contacts");
        if (c?.id) record_ids.contact_id = c.id;
        break;
      }

      case "outreach_generation": {
        let message = plan.outreach?.draft_message ?? plan.assistant_message;
        const company = plan.outreach?.company ?? "";
        const role = plan.outreach?.role ?? "";

        const job = await findJobForOutreach(supabase, userId, company, role);
        const topSkills = [...(skillRows ?? [])]
          .sort(
            (a, b) => (b.proficiency ?? 0) - (a.proficiency ?? 0),
          )
          .slice(0, 12)
          .map((x) => x.name);

        if (job?.jd_text && message) {
          message = await refineOutreachWithJd({
            draft: message,
            jdText: job.jd_text,
            topSkills,
            company: job.company,
            role: job.title,
          });
        }

        outreach = {
          message,
          format: plan.outreach?.format ?? "linkedin",
        };

        insights = {
          job_matched_id: job?.id ?? null,
          used_jd: Boolean(job?.jd_text),
        };
        break;
      }

      default:
        break;
    }

    await logBioVault(supabase, userId, "assistant", plan.assistant_message, {
      intent: plan.intent,
      updated_tables,
      record_ids,
      insights,
    });

    const delta = computeDelta(plan, updated_tables, outreach);

    return {
      ok: true,
      intent: plan.intent,
      assistant_message: plan.assistant_message,
      updated_tables,
      insights,
      record_ids,
      outreach,
      delta,
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Orchestrator execution failed.";
    await logBioVault(supabase, userId, "assistant", msg, {
      intent: plan.intent,
      error: true,
    });
    return {
      ok: false,
      intent: plan.intent,
      assistant_message: msg,
      updated_tables,
      insights,
      record_ids,
    };
  }
}
