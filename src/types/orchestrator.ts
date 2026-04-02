export type OrchestratorDelta = {
  pipelineJobs?: number;
  skillsIndexed?: number;
  contacts?: number;
  experienceBlocks?: number;
  outreachDraft?: boolean;
  bioVaultLogs?: number;
};

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
  if (message.length > 450) return "apply";
  const lower = message.toLowerCase();
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
