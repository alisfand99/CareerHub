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

type HubProps = {
  applyCount: number;
  bioAtomCount: number;
  networkCount: number;
  signedIn: boolean;
  configured: boolean;
};

/** Minimal frame: top-left + bottom-right only */
function CommandFrameCorners() {
  const corner =
    "pointer-events-none absolute border-cyan-500/20";
  return (
    <>
      <span
        className={cn(corner, "left-4 top-4 h-5 w-5 border-l border-t md:left-6 md:top-6")}
        aria-hidden
      />
      <span
        className={cn(corner, "bottom-4 right-4 h-5 w-5 border-b border-r md:bottom-6 md:right-6")}
        aria-hidden
      />
    </>
  );
}

function NeuralCoreOrb({
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
      className="group/core relative flex size-[8.5rem] shrink-0 items-center justify-center rounded-full outline-none ring-offset-[#050505] transition-shadow duration-500 hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.35)] focus-visible:ring-2 focus-visible:ring-cyan-400/50 md:size-[10.25rem]"
      aria-label="Open command center"
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      animate={{ scale: isPulsing ? 1.035 : 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
      {/* Slow outer ring — only while orchestrator is active */}
      <motion.span
        className="pointer-events-none absolute inset-[-14%] rounded-full border border-cyan-500/25"
        aria-hidden
        animate={{ rotate: isPulsing ? 360 : 0 }}
        transition={{
          duration: isPulsing ? 56 : 0,
          repeat: isPulsing ? Infinity : 0,
          ease: "linear",
        }}
      />
      <motion.span
        className="absolute inset-[-28%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14)_0%,transparent_68%)] blur-2xl"
        animate={{
          opacity: isPulsing ? [0.55, 0.88, 0.55] : 0.5,
          scale: isPulsing ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: isPulsing ? 2.4 : 0,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-[-10%] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,rgba(34,211,238,0.22)_35%,transparent_62%)] opacity-80"
        aria-hidden
      />
      <span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.2)_0%,rgba(34,211,238,0.28)_22%,rgba(8,12,18,0.95)_58%,rgba(5,5,6,0.98)_100%)]"
        style={{
          boxShadow:
            "inset 0 0 36px rgba(34,211,238,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-[14%] rounded-full border border-white/[0.07] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.2)_0%,rgba(5,5,8,0.85)_100%)]"
        aria-hidden
      />
      <Sparkles
        className="relative z-10 size-9 text-cyan-100/95 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)] transition-transform duration-500 group-hover/core:scale-105 md:size-10"
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
}: HubProps) {
  const { isPulsing, flowTarget, setOpen } = useOrchestrator();
  const manualDisabled = !signedIn || !configured;

  const applyActive = flowTarget === "apply";
  const bioActive = flowTarget === "bio";
  const netActive = flowTarget === "network";

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#080808] via-[#060606] to-[#050505] p-2 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]"
      aria-label="Orchestrator command center"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_18%_45%,rgba(34,211,238,0.07),transparent_55%),radial-gradient(ellipse_60%_50%_at_92%_18%,rgba(245,158,11,0.04),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25 animate-neural-mesh-drift"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 88% 78% at 50% 50%, black 25%, transparent 78%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"
        aria-hidden
      />

      <CommandFrameCorners />

      <div className="relative z-10 px-4 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10">
        <h2 className="mb-8 font-mono text-[0.6rem] font-medium uppercase tracking-[0.42em] text-cyan-500/55 md:mb-10 md:text-[0.65rem]">
          Summary
        </h2>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(260px,1fr)_minmax(280px,1.15fr)] lg:gap-x-10 lg:gap-y-0">
          <div className="flex justify-center lg:justify-end lg:pr-2">
            <NeuralCoreOrb isPulsing={isPulsing} onOpen={() => setOpen(true)} />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-4">
              <PillarMindCard
                href="/apply-hub"
                title="Apply Hub"
                subtitle="Pipeline · posting insights"
                count={applyCount}
                icon={Briefcase}
                highlight={applyActive}
                manual={
                  <AddJobDialog disabled={manualDisabled} compactTrigger />
                }
              />
              <PillarMindCard
                href="/bio-vault"
                title="Bio-Vault"
                subtitle="Skills · evidence"
                count={bioAtomCount}
                icon={Boxes}
                highlight={bioActive}
                manual={
                  <AddSkillDialog disabled={manualDisabled} compactTrigger />
                }
              />
              <PillarMindCard
                href="/network"
                title="Network CRM"
                subtitle="Contacts · referrals"
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

      <p className="relative z-10 border-t border-white/[0.06] bg-black/30 px-4 py-3 text-center font-serif text-xs font-light leading-relaxed text-white/40 md:px-8">
        Intent routes to each pillar. Open the{" "}
        <span className="text-cyan-400/75">command center</span> above — or
        use <span className="font-mono text-white/50">+</span> on hover to add
        manually.
      </p>
    </section>
  );
}

function PillarMindCard({
  href,
  title,
  subtitle,
  count,
  icon: Icon,
  highlight,
  manual,
}: {
  href: string;
  title: string;
  subtitle: string;
  count: number;
  icon: LucideIcon;
  highlight: boolean;
  manual: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm transition-all duration-500",
        "hover:border-white/[0.11] hover:bg-white/[0.035]",
        highlight && "border-cyan-500/25 bg-white/[0.04]",
      )}
    >
      <p className="pointer-events-none absolute right-3 top-2 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/0 transition-opacity duration-300 group-hover/card:text-white/35">
        Routed
      </p>

      <div className="relative flex items-center gap-3 px-4 py-3 md:gap-3 md:px-4 md:py-3.5">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none ring-offset-[#050505] focus-visible:ring-2 focus-visible:ring-cyan-400/40 md:gap-3.5"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05]",
              highlight && "border-cyan-500/20 bg-cyan-500/[0.08]",
            )}
          >
            <Icon
              className={cn(
                "size-[1.15rem]",
                highlight ? "text-cyan-200/90" : "text-white/55",
              )}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white/88">
              {title}
            </p>
            <p className="mt-0.5 truncate font-serif text-xs font-light text-white/45">
              {subtitle}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-xs tabular-nums text-white/75",
              highlight && "border-cyan-500/20 text-cyan-100/90",
            )}
          >
            {count}
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-white/25 transition-colors group-hover/card:text-white/45"
            aria-hidden
          />
        </Link>
        <div className="relative z-20 shrink-0">{manual}</div>
      </div>
    </div>
  );
}
