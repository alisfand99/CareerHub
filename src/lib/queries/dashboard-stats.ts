import type { SupabaseClient } from "@supabase/supabase-js";

export type JobStatus = "wishlist" | "applied" | "interview" | "offer";

export type DashboardStats = {
  jobsTotal: number;
  jobsByStatus: Record<JobStatus, number>;
  skillsCount: number;
  projectsCount: number;
  experienceCount: number;
  bioMessagesCount: number;
  contactsCount: number;
  avgRelationship: number | null;
  referralLinksCount: number;
};

const emptyJobsByStatus: Record<JobStatus, number> = {
  wishlist: 0,
  applied: 0,
  interview: 0,
  offer: 0,
};

export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ stats: DashboardStats; error: string | null }> {
  const statuses: JobStatus[] = [
    "wishlist",
    "applied",
    "interview",
    "offer",
  ];

  const jobCountQueries = statuses.map((status) =>
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", status),
  );

  const [
    jobsTotalRes,
    skillsRes,
    projectsRes,
    experienceRes,
    bioRes,
    contactsCountRes,
    contactStrengthsRes,
    referralsRes,
    ...jobByStatusRes
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("master_skills")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("experience_blocks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("bio_vault_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("contacts")
      .select("relationship_strength")
      .eq("user_id", userId),
    supabase
      .from("contact_job_referrals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    ...jobCountQueries,
  ]);

  const jobsByStatus = { ...emptyJobsByStatus };
  statuses.forEach((status, i) => {
    jobsByStatus[status] = jobByStatusRes[i].count ?? 0;
  });

  const contactsRows = contactStrengthsRes.data ?? [];
  const strengthSum = contactsRows.reduce(
    (acc, row) => acc + (row.relationship_strength ?? 0),
    0,
  );
  const avgRelationship =
    contactsRows.length > 0 ? strengthSum / contactsRows.length : null;

  const responses = [
    jobsTotalRes,
    skillsRes,
    projectsRes,
    experienceRes,
    bioRes,
    contactsCountRes,
    contactStrengthsRes,
    referralsRes,
    ...jobByStatusRes,
  ];
  const failed = responses.find((r) => r.error);
  if (failed?.error) {
    return {
      stats: emptyDashboardStats(),
      error: failed.error.message,
    };
  }

  return {
    stats: {
      jobsTotal: jobsTotalRes.count ?? 0,
      jobsByStatus,
      skillsCount: skillsRes.count ?? 0,
      projectsCount: projectsRes.count ?? 0,
      experienceCount: experienceRes.count ?? 0,
      bioMessagesCount: bioRes.count ?? 0,
      contactsCount: contactsCountRes.count ?? 0,
      avgRelationship,
      referralLinksCount: referralsRes.count ?? 0,
    },
    error: null,
  };
}

export function emptyDashboardStats(): DashboardStats {
  return {
    jobsTotal: 0,
    jobsByStatus: { ...emptyJobsByStatus },
    skillsCount: 0,
    projectsCount: 0,
    experienceCount: 0,
    bioMessagesCount: 0,
    contactsCount: 0,
    avgRelationship: null,
    referralLinksCount: 0,
  };
}
