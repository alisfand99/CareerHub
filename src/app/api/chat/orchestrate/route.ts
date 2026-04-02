import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { executeOrchestratorPlan } from "@/lib/ai/execute-orchestrator-plan";
import { generateOrchestratorPlan } from "@/lib/ai/gemini-orchestrate";
import {
  getGeminiApiKey,
  missingGeminiEnvMessage,
} from "@/lib/ai/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  message: z.string().min(1).max(120_000),
});

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

    const result = await executeOrchestratorPlan(
      supabase,
      user.id,
      message,
      plan,
    );

    return NextResponse.json(result);
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
