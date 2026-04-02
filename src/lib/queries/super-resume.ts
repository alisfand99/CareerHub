import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileResumeRow = {
  id: string;
  display_name: string | null;
  headline: string | null;
  summary: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  public_email: string | null;
};

export type ExperienceResumeRow = {
  id: string;
  title: string;
  organization: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  bullets: unknown;
  raw_ingest: string | null;
};

export type SkillResumeRow = {
  id: string;
  name: string;
  category: string | null;
  proficiency: number | null;
  tools: string[] | null;
  evidence: string | null;
};

export type ProjectResumeRow = {
  id: string;
  name: string;
  summary: string | null;
  tech_stack: string[] | null;
  url: string | null;
};

export type EducationRow = {
  id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

export type CertificationRow = {
  id: string;
  name: string;
  issuing_org: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  credential_url: string | null;
};

export type LanguageRow = {
  id: string;
  name: string;
  proficiency: string | null;
};

export type SuperResumeBundle = {
  profile: ProfileResumeRow | null;
  experiences: ExperienceResumeRow[];
  skills: SkillResumeRow[];
  projects: ProjectResumeRow[];
  education: EducationRow[];
  certifications: CertificationRow[];
  languages: LanguageRow[];
};

export type SuperResumeLoadResult = {
  bundle: SuperResumeBundle;
  /** True if any section failed to load (missing tables/columns, RLS, network). */
  hadLoadFailures: boolean;
};

export async function fetchSuperResumeBundle(
  supabase: SupabaseClient,
  userId: string,
): Promise<SuperResumeLoadResult> {
  const [
    profileRes,
    expRes,
    skillsRes,
    projRes,
    eduRes,
    certRes,
    langRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("experience_blocks")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("master_skills")
      .select("id, name, category, proficiency, tools, evidence")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("projects")
      .select("id, name, summary, tech_stack, url")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("education_entries")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("certification_entries")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("issue_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("language_entries")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("name"),
  ]);

  let hadLoadFailures = false;

  const logSection = (section: string, err: { message?: string; code?: string }) => {
    hadLoadFailures = true;
    console.error(`[Bio-Vault] ${section} load failed:`, err.message ?? err);
  };

  const profile = profileRes.error
    ? (logSection("Profile", profileRes.error), null)
    : ((profileRes.data as ProfileResumeRow | null) ?? null);

  const experiences = expRes.error
    ? (logSection("Experience", expRes.error), [])
    : ((expRes.data ?? []) as ExperienceResumeRow[]);

  const skills = skillsRes.error
    ? (logSection("Skills", skillsRes.error), [])
    : ((skillsRes.data ?? []) as SkillResumeRow[]);

  const projects = projRes.error
    ? (logSection("Projects", projRes.error), [])
    : ((projRes.data ?? []) as ProjectResumeRow[]);

  const education = eduRes.error
    ? (logSection("Education", eduRes.error), [])
    : ((eduRes.data ?? []) as EducationRow[]);

  const certifications = certRes.error
    ? (logSection("Certifications", certRes.error), [])
    : ((certRes.data ?? []) as CertificationRow[]);

  const languages = langRes.error
    ? (logSection("Languages", langRes.error), [])
    : ((langRes.data ?? []) as LanguageRow[]);

  return {
    bundle: {
      profile,
      experiences,
      skills,
      projects,
      education,
      certifications,
      languages,
    },
    hadLoadFailures,
  };
}
