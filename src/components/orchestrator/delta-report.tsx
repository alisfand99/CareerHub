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
        "flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider",
        positive && "border-cyan-500/25 bg-cyan-500/[0.08]",
      )}
    >
      <span className="text-white/50">{label}</span>
      <span className="font-semibold tabular-nums normal-case tracking-normal text-cyan-200/90">
        {value}
      </span>
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
        "mt-2 space-y-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-2",
        className,
      )}
    >
      <p className="px-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-cyan-400/90">
        Delta report
      </p>
      {rows.map((r) => (
        <Row key={r.label} {...r} />
      ))}
    </div>
  );
}
