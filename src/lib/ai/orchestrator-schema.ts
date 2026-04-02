import { z } from "zod";

export const OrchestratorIntentSchema = z.enum([
  "job_description",
  "skill_project_update",
  "contact_networking",
  "outreach_generation",
  "general",
]);

export const OrchestratorPlanSchema = z.object({
  intent: OrchestratorIntentSchema,
  /** Strategic, concise voice — technical talent agent */
  assistant_message: z.string(),
  job: z
    .object({
      title: z.string(),
      company: z.string(),
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
        proficiency: z.number().min(1).max(5).optional(),
        tools: z.array(z.string()).optional(),
        achievements: z.string().optional(),
      }),
    )
    .optional(),
  experience: z
    .object({
      title: z.string(),
      organization: z.string().optional(),
      bullets: z.array(z.string()).optional(),
      raw_ingest: z.string().optional(),
    })
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
      company: z.string(),
      role: z.string(),
      draft_message: z.string(),
      format: z.enum(["linkedin", "email", "cover_letter"]).optional(),
    })
    .optional(),
  /** Canonical resume / profile block after skill or project updates */
  resume_refactor_markdown: z.string().optional(),
});

export type OrchestratorPlan = z.infer<typeof OrchestratorPlanSchema>;
export type OrchestratorIntent = z.infer<typeof OrchestratorIntentSchema>;
