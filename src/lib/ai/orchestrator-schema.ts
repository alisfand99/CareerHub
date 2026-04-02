import { z } from "zod";

export const OrchestratorIntentSchema = z.enum([
  "job_description",
  "skill_project_update",
  "contact_networking",
  "outreach_generation",
  "general",
]);

const skillProficiencySchema = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return undefined;
    const n =
      typeof v === "string"
        ? parseFloat(String(v).replace(/[^\d.]/g, ""))
        : Number(v);
    if (!Number.isFinite(n)) return undefined;
    const r = Math.round(n);
    if (r < 1 || r > 5) return undefined;
    return r;
  },
  z.number().min(1).max(5).optional(),
);

const experienceBlockSchema = z.object({
  title: z.string(),
  organization: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
  bullets: z.array(z.string()).optional(),
  raw_ingest: z.string().optional(),
});

export const OrchestratorPlanSchema = z.object({
  intent: OrchestratorIntentSchema,
  /** Strategic, concise voice — technical talent agent */
  assistant_message: z.string(),
  job: z
    .object({
      title: z.string().optional(),
      company: z.string().optional(),
      jd_text: z.string().optional(),
      required_skills: z.array(z.string()).optional(),
      job_family: z.string().optional(),
    })
    .optional(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z.string().optional(),
        proficiency: skillProficiencySchema,
        tools: z.array(z.string()).optional(),
        achievements: z.string().optional(),
      }),
    )
    .optional(),
  /** Legacy single block; prefer `experiences` for résumé imports */
  experience: experienceBlockSchema.optional(),
  /** Multiple roles from a CV / LinkedIn export */
  experiences: z.array(experienceBlockSchema).optional(),
  profile: z
    .object({
      display_name: z.string().optional(),
      headline: z.string().optional(),
      summary: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      public_email: z.string().optional(),
    })
    .optional(),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().optional(),
        field_of_study: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        is_current: z.boolean().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuing_org: z.string().optional(),
        issue_date: z.string().optional(),
        expiration_date: z.string().optional(),
        credential_url: z.string().optional(),
      }),
    )
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.string().optional(),
      }),
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        summary: z.string().optional(),
        tech_stack: z.array(z.string()).optional(),
        url: z.string().optional(),
      }),
    )
    .optional(),
  contact: z
    .object({
      full_name: z.string(),
      company: z.string().optional(),
      role_title: z.string().optional(),
      email: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  outreach: z
    .object({
      company: z.string().optional(),
      role: z.string().optional(),
      draft_message: z.string().optional(),
      format: z.enum(["linkedin", "email", "cover_letter"]).optional(),
    })
    .optional(),
  /** Canonical resume / profile block after skill or project updates */
  resume_refactor_markdown: z.string().optional(),
});

export type OrchestratorPlan = z.infer<typeof OrchestratorPlanSchema>;
export type OrchestratorIntent = z.infer<typeof OrchestratorIntentSchema>;
