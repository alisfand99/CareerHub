import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseContactProfileFromRaw } from "@/lib/ai/parse-contact-profile";
import {
  getGeminiApiKey,
  missingGeminiEnvMessage,
} from "@/lib/ai/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  raw: z.string().min(1).max(120_000),
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
      { error: "raw is required (string, max 120k chars)" },
      { status: 400 },
    );
  }

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

  const { raw } = parsed.data;

  let profile;
  try {
    profile = await parseContactProfileFromRaw(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "GEMINI_API_KEY_MISSING") {
      return NextResponse.json({ error: missingGeminiEnvMessage }, { status: 503 });
    }
    return NextResponse.json(
      {
        error:
          "Could not parse this input. Try a clearer LinkedIn URL or paste more profile text.",
      },
      { status: 422 },
    );
  }

  const { data: row, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      full_name: profile.full_name,
      company: profile.company?.trim() || null,
      role_title: profile.role_title?.trim() || null,
      email: profile.email?.trim() || null,
      phone: profile.phone?.trim() || null,
      linkedin_url: profile.linkedin_url?.trim() || null,
      keywords: profile.keywords.length ? profile.keywords : null,
      notes: raw.length > 2000 ? `${raw.slice(0, 2000)}…` : raw,
      ai_expertise: { source: "linkedin_ingest", at: new Date().toISOString() },
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save contact" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, contact: row ?? undefined });
}
