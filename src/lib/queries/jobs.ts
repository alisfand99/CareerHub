import type { SupabaseClient } from "@supabase/supabase-js";

export type JobRow = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  status: string;
  jd_text: string | null;
  ai_match_score: number | null;
  ai_stretch_skills: unknown;
  ai_gap_analysis: unknown;
  ai_insights: unknown;
  created_at: string;
  updated_at: string;
};

export async function fetchUserJobs(
  supabase: SupabaseClient,
  userId: string,
): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as JobRow[];
}

export async function fetchUserJobById(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
): Promise<JobRow | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw error;
  return (data as JobRow | null) ?? null;
}
