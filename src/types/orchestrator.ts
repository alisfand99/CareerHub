export type OrchestratorDelta = {
  pipelineJobs?: number;
  skillsIndexed?: number;
  contacts?: number;
  experienceBlocks?: number;
  outreachDraft?: boolean;
  bioVaultLogs?: number;
  profileUpdated?: boolean;
  educationAdded?: number;
  certificationsAdded?: number;
  languagesAdded?: number;
  projectsAdded?: number;
};

/**
 * True when server-rendered pages should refetch (Supabase-backed RSC).
 * Excludes outreach-only drafts (client state already holds the message).
 */
export function orchestratorDeltaNeedsRscRefresh(
  d: OrchestratorDelta | undefined,
): boolean {
  if (!d) return false;
  return (
    (d.pipelineJobs ?? 0) > 0 ||
    (d.skillsIndexed ?? 0) > 0 ||
    (d.experienceBlocks ?? 0) > 0 ||
    (d.contacts ?? 0) > 0 ||
    (d.bioVaultLogs ?? 0) > 0 ||
    (d.educationAdded ?? 0) > 0 ||
    (d.certificationsAdded ?? 0) > 0 ||
    (d.languagesAdded ?? 0) > 0 ||
    (d.projectsAdded ?? 0) > 0 ||
    Boolean(d.profileUpdated)
  );
}

export type FlowTarget = "apply" | "bio" | "network";

export function intentToFlowTarget(intent: string): FlowTarget | null {
  switch (intent) {
    case "job_description":
      return "apply";
    case "skill_project_update":
      return "bio";
    case "contact_networking":
    case "outreach_generation":
      return "network";
    default:
      return null;
  }
}

export function guessFlowTargetFromMessage(message: string): FlowTarget | null {
  const lower = message.toLowerCase();
  if (
    message.length > 280 &&
    /(resume|cv\b|curriculum|education|degree|university|bachelor|master|phd|certification|certificate|work experience|employment history|linkedin profile|bio-vault|bio vault|extract everything|please extract)/.test(
      lower,
    )
  ) {
    return "bio";
  }
  if (message.length > 450) return "apply";
  if (
    /(linkedin|outreach|network|dm\b|cover letter|coffee chat|intro)/.test(
      lower,
    )
  ) {
    return "network";
  }
  if (
    /(skill|project|resume|vault|proficiency|stack)/.test(lower) &&
    message.length < 500
  ) {
    return "bio";
  }
  return null;
}
