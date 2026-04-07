import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { executeOrchestratorPlan } from "@/lib/ai/execute-orchestrator-plan";
import { generateOrchestratorPlan } from "@/lib/ai/gemini-orchestrate";
import type { OrchestratorPlan } from "@/lib/ai/orchestrator-schema";
import {
  getGeminiApiKey,
  missingGeminiEnvMessage,
} from "@/lib/ai/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  message: z.string().min(1).max(120_000),
});

type SuggestedAction =
  | "found_job"
  | "import_resume"
  | "refactor_resume"
  | "create_contact"
  | "draft_outreach"
  | "general_chat";

function assessPlanConfidence(message: string, plan: OrchestratorPlan): number {
  const m = message.toLowerCase();
  const hasResumeSignals =
    /(resume|cv\b|education|certification|linkedin|experience|projects)/.test(
      m,
    ) || message.length > 320;

  switch (plan.intent) {
    case "job_description": {
      const hasTitle = Boolean(plan.job?.title?.trim());
      const hasCompany = Boolean(plan.job?.company?.trim());
      const hasJd = Boolean(plan.job?.jd_text?.trim());
      const hasSkills = (plan.job?.required_skills?.length ?? 0) >= 3;
      if ((hasTitle && hasCompany && hasSkills) || hasJd) return 0.92;
      if (hasTitle && hasCompany) return 0.76;
      return 0.4;
    }
    case "skill_project_update": {
      const richness =
        (plan.experiences?.length ?? 0) +
        (plan.skills?.length ?? 0) +
        (plan.projects?.length ?? 0) +
        (plan.education?.length ?? 0) +
        (plan.certifications?.length ?? 0) +
        (plan.languages?.length ?? 0) +
        (plan.profile ? 1 : 0);
      if (richness >= 3) return 0.9;
      if (richness >= 1 || hasResumeSignals) return 0.72;
      return 0.45;
    }
    case "contact_networking":
      return plan.contact?.full_name?.trim() ? 0.88 : 0.42;
    case "outreach_generation": {
      const hasDraft = Boolean(plan.outreach?.draft_message?.trim());
      const hasCompanyOrRole = Boolean(
        plan.outreach?.company?.trim() || plan.outreach?.role?.trim(),
      );
      if (hasDraft && hasCompanyOrRole) return 0.9;
      if (hasDraft) return 0.74;
      return 0.46;
    }
    case "general":
      return message.trim().length > 14 ? 0.7 : 0.5;
    default:
      return 0.5;
  }
}

function suggestActions(message: string, plan: OrchestratorPlan): SuggestedAction[] {
  const m = message.toLowerCase();
  const out: SuggestedAction[] = [];
  if (/(job|jd|posting|role|position)/.test(m) || plan.intent === "job_description") {
    out.push("found_job");
  }
  if (/(resume|cv|linkedin|experience|education|certificate|project)/.test(m)) {
    out.push("import_resume");
    out.push("refactor_resume");
  }
  if (/(contact|recruiter|hiring manager|network|connection|intro)/.test(m)) {
    out.push("create_contact");
    out.push("draft_outreach");
  }
  if (out.length === 0) out.push("general_chat");
  return Array.from(new Set(out)).slice(0, 3);
}

function formatClarifyingMessage(actions: SuggestedAction[]): string {
  const map: Record<SuggestedAction, string> = {
    found_job: "Save a new job posting",
    import_resume: "Import/update Bio-Vault from resume text",
    refactor_resume: "Generate a tailored resume draft",
    create_contact: "Save a networking contact",
    draft_outreach: "Draft outreach message",
    general_chat: "Ask a general question",
  };
  const choices = actions.map((a, i) => `${i + 1}) ${map[a]}`).join("\n");
  return (
    "I can help, but your request is a bit ambiguous.\n" +
    "Tell me which action you want:\n" +
    `${choices}\n\n` +
    "Or just paste the exact text (job posting / resume / contact details) and I will route it automatically."
  );
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "message is required (string, max 120k chars)" },
      { status: 400 },
    );
  }

  const { message } = parsed.data;

  if (!getGeminiApiKey()) {
    return NextResponse.json(
      { error: missingGeminiEnvMessage },
      { status: 503 },
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      { error: "This workspace is not fully set up yet. Try again later or contact support." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: skillRows } = await supabase
    .from("master_skills")
    .select("name")
    .eq("user_id", user.id);

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("title, company")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const skillNames = skillRows?.map((r) => r.name) ?? [];
  const jobsSummary = jobRows ?? [];

  try {
    const plan = await generateOrchestratorPlan(message, {
      skillNames,
      jobsSummary,
    });
    const intentConfidence = assessPlanConfidence(message, plan);
    const suggested = suggestActions(message, plan);
    const needsClarification =
      intentConfidence < 0.56 || (plan.intent === "general" && suggested[0] !== "general_chat");

    if (needsClarification) {
      return NextResponse.json({
        ok: true,
        intent: "general",
        intent_confidence: intentConfidence,
        needs_clarification: true,
        suggested_actions: suggested,
        assistant_message: formatClarifyingMessage(suggested),
        updated_tables: [],
      });
    }

    const result = await executeOrchestratorPlan(
      supabase,
      user.id,
      message,
      plan,
    );

    return NextResponse.json({
      ...result,
      intent_confidence: intentConfidence,
      needs_clarification: false,
      suggested_actions: suggested,
    });
  } catch (e) {
    const msg =
      e instanceof Error && e.message === "GEMINI_API_KEY_MISSING"
        ? missingGeminiEnvMessage
        : e instanceof Error
          ? e.message
          : "Orchestrator failed";
    return NextResponse.json({ error: msg, ok: false }, { status: 500 });
  }
}
