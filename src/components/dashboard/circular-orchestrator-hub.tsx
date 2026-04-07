"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Boxes, ChevronRight, Network, Sparkles } from "lucide-react";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { cn } from "@/lib/utils";
import {
  AddContactDialog,
  AddJobDialog,
  AddSkillDialog,
} from "@/components/dashboard/dashboard-manual-forms";

export type PillarMetricLabels = {
  primary: string;
  secondary: string;
};

export type HubProps = {
  applyCount: number;
  bioAtomCount: number;
  networkCount: number;
  signedIn: boolean;
  configured: boolean;
  pillarMetrics: {
    apply: PillarMetricLabels;
    bio: PillarMetricLabels;
    network: PillarMetricLabels;
  };
};

function BranchConnectors() {
  return (
    <svg
      className="pointer-events-none absolute -left-10 top-1/2 hidden h-[min(100%,22rem)] w-14 -translate-y-1/2 text-cyan-400/75 lg:block"
      viewBox="0 0 64 280"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        d="M 0 140 C 20 140 24 52 64 44"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        d="M 0 140 L 64 140"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        d="M 0 140 C 20 140 24 228 64 236"
      />
    </svg>
  );
}

function NeuralCoreOrbLight({
  isPulsing,
  onOpen,
}: {
  isPulsing: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="group/core relative flex size-[7.5rem] shrink-0 items-center justify-center rounded-full bg-white outline-none ring-offset-slate-50 transition-shadow duration-500 hover:shadow-[0_0_48px_-6px_rgba(34,211,238,0.55)] focus-visible:ring-2 focus-visible:ring-cyan-400/50 md:size-[9.25rem]"
      aria-label="Open career assistant"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{ scale: isPulsing ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{
        boxShadow:
          "0 0 0 1px rgba(34, 211, 238, 0.25), 0 12px 40px -8px rgba(34, 211, 238, 0.45), 0 4px 16px rgba(15, 23, 42, 0.06)",
      }}
    >
      <motion.span
        className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2)_0%,transparent_65%)] blur-xl"
        animate={{
          opacity: isPulsing ? [0.65, 1, 0.65] : 0.75,
        }}
        transition={{
          duration: isPulsing ? 2.4 : 0,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut",
        }}
        aria-hidden
      />
      <Sparkles
        className="relative z-10 size-8 text-cyan-600 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-transform duration-500 group-hover/core:scale-105 md:size-9"
        aria-hidden
      />
    </motion.button>
  );
}

export function CircularOrchestratorHub({
  applyCount,
  bioAtomCount,
  networkCount,
  signedIn,
  configured,
  pillarMetrics,
}: HubProps) {
  const { isPulsing, flowTarget, setOpen } = useOrchestrator();
  const manualDisabled = !signedIn || !configured;

  const applyActive = flowTarget === "apply";
  const bioActive = flowTarget === "bio";
  const netActive = flowTarget === "network";

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-200/40 bg-gradient-to-br from-white/90 via-slate-50/95 to-cyan-50/30 p-1 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.15)] backdrop-blur-md"
      aria-label="Orchestrator command center"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_20%_30%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_95%_10%,rgba(8,145,178,0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-10 px-5 pb-8 pt-9 md:px-10 md:pb-10 md:pt-11">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(200px,280px)_auto_1fr] lg:items-center lg:gap-6 xl:gap-10">
          <div className="max-w-md space-y-3">
            <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.42em] text-slate-500 md:text-[0.65rem]">
              Summary
            </p>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-900 md:text-4xl">
              Career-Hub AI
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              Career command center
            </p>
          </div>

          <div className="flex justify-center lg:justify-center">
            <NeuralCoreOrbLight isPulsing={isPulsing} onOpen={() => setOpen(true)} />
          </div>

          <div className="relative min-w-0 lg:pl-4">
            <BranchConnectors />
            <div className="relative z-10 flex flex-col gap-3.5 lg:gap-4">
              <PillarGlassCard
                href="/apply-hub"
                title="Apply Hub"
                metrics={pillarMetrics.apply}
                count={applyCount}
                icon={Briefcase}
                highlight={applyActive}
                manual={<AddJobDialog disabled={manualDisabled} compactTrigger />}
              />
              <PillarGlassCard
                href="/bio-vault"
                title="Bio-Vault"
                metrics={pillarMetrics.bio}
                count={bioAtomCount}
                icon={Boxes}
                highlight={bioActive}
                manual={<AddSkillDialog disabled={manualDisabled} compactTrigger />}
              />
              <PillarGlassCard
                href="/network"
                title="Network CRM"
                metrics={pillarMetrics.network}
                count={networkCount}
                icon={Network}
                highlight={netActive}
                manual={
                  <AddContactDialog disabled={manualDisabled} compactTrigger />
                }
              />
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 border-t border-slate-200/80 bg-white/50 px-4 py-3 text-center text-xs leading-relaxed text-slate-500 md:px-8">
        Tap the{" "}
        <span className="font-medium text-cyan-700">sparkle core</span> for the
        career assistant — or use{" "}
        <span className="font-mono text-slate-600">+</span> on each card to add
        manually.
      </p>
    </section>
  );
}

function PillarGlassCard({
  href,
  title,
  metrics,
  count,
  icon: Icon,
  highlight,
  manual,
}: {
  href: string;
  title: string;
  metrics: PillarMetricLabels;
  count: number;
  icon: LucideIcon;
  highlight: boolean;
  manual: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-2xl border bg-white/75 shadow-sm backdrop-blur-md transition-all duration-500",
        highlight
          ? "border-cyan-300/70 shadow-[0_12px_40px_-20px_rgba(34,211,238,0.35)]"
          : "border-cyan-100/80 hover:border-cyan-200/90 hover:shadow-md",
      )}
    >
      <div className="flex items-stretch gap-2 px-4 py-3.5 md:px-4 md:py-4">
        <Link
          href={href}
          className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg outline-none ring-offset-white focus-visible:ring-2 focus-visible:ring-cyan-400/40"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border bg-slate-50",
                highlight
                  ? "border-cyan-200 bg-cyan-50"
                  : "border-slate-200/90",
              )}
            >
              <Icon
                className={cn(
                  "size-[1.15rem]",
                  highlight ? "text-cyan-700" : "text-slate-600",
                )}
                aria-hidden
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-semibold tracking-tight text-slate-900">
                {title}
              </p>
              <p className="mt-2 text-[0.65rem] text-slate-500">
                Total in workspace:{" "}
                <span className="tabular-nums font-medium text-slate-700">
                  {count}
                </span>
              </p>
            </div>
            <ChevronRight
              className="mt-0.5 size-4 shrink-0 text-slate-300 transition-colors group-hover/card:text-cyan-600"
              aria-hidden
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-cyan-900">
              {metrics.primary}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-slate-600">
              {metrics.secondary}
            </span>
          </div>
        </Link>
        <div className="flex shrink-0 items-start pt-0.5">{manual}</div>
      </div>
    </div>
  );
}
