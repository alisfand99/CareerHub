"use client";

import type { OrchestratorDelta } from "@/types/orchestrator";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs",
        positive && "border-primary/25 bg-primary/5",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function DeltaReport({
  delta,
  className,
}: {
  delta: OrchestratorDelta;
  className?: string;
}) {
  const rows: { label: string; value: string; positive?: boolean }[] = [];

  if (delta.pipelineJobs && delta.pipelineJobs > 0) {
    rows.push({
      label: "Pipeline",
      value: `+${delta.pipelineJobs} job`,
      positive: true,
    });
  }
  if (delta.skillsIndexed && delta.skillsIndexed > 0) {
    rows.push({
      label: "Vault",
      value: `+${delta.skillsIndexed} skill${delta.skillsIndexed > 1 ? "s" : ""}`,
      positive: true,
    });
  }
  if (delta.experienceBlocks && delta.experienceBlocks > 0) {
    rows.push({
      label: "Experience",
      value: `+${delta.experienceBlocks} block`,
      positive: true,
    });
  }
  if (delta.contacts && delta.contacts > 0) {
    rows.push({
      label: "Network",
      value: `+${delta.contacts} contact`,
      positive: true,
    });
  }
  if (delta.outreachDraft) {
    rows.push({
      label: "Outreach",
      value: "Draft ready",
      positive: true,
    });
  }
  if (delta.bioVaultLogs && delta.bioVaultLogs > 0) {
    rows.push({
      label: "Resume",
      value: "Résumé draft updated",
      positive: true,
    });
  }
  if (delta.profileUpdated) {
    rows.push({
      label: "Profile",
      value: "Updated",
      positive: true,
    });
  }
  if (delta.educationAdded && delta.educationAdded > 0) {
    rows.push({
      label: "Education",
      value: `+${delta.educationAdded}`,
      positive: true,
    });
  }
  if (delta.certificationsAdded && delta.certificationsAdded > 0) {
    rows.push({
      label: "Certificates",
      value: `+${delta.certificationsAdded}`,
      positive: true,
    });
  }
  if (delta.languagesAdded && delta.languagesAdded > 0) {
    rows.push({
      label: "Languages",
      value: `+${delta.languagesAdded}`,
      positive: true,
    });
  }
  if (delta.projectsAdded && delta.projectsAdded > 0) {
    rows.push({
      label: "Projects",
      value: `+${delta.projectsAdded}`,
      positive: true,
    });
  }

  if (rows.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-2 space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2",
        className,
      )}
    >
      <p className="px-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
        Delta report
      </p>
      {rows.map((r) => (
        <Row key={r.label} {...r} />
      ))}
    </div>
  );
}
