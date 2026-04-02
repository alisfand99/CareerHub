import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  company: string | null;
  role_title: string | null;
  linkedin_url: string | null;
  phone: string | null;
  keywords: string[] | null;
  relationship_strength: number;
  notes: string | null;
  ai_expertise: unknown;
  ai_influence_sphere: unknown;
  referral_target_job_id: string | null;
  last_touch_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchUserContacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContactRow[];
}
