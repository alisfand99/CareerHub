"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { motion } from "framer-motion";
import { Briefcase, Boxes, ChevronRight, Network, Sparkles } from "lucide-react";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { Badge } from "@/components/ui/badge";
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

/**
 * Horizontal mind-map fibers: left edge (core side) → right edge (card column).
 * viewBox height 300 maps to three stacked pillar centers at y ≈ 50, 150, 250.
 */
const MIND_MAP_PATHS = {
  apply: "M 0 52 C 42 52 58 50 100 50",
  bio: "M 0 150 C 44 150 56 150 100 150",
  network: "M 0 248 C 42 248 58 250 100 250",
} as const;

const PATH_END = {
  apply: { cx: 100, cy: 50 },
  bio: { cx: 100, cy: 150 },
  network: { cx: 100, cy: 250 },
} as const;

function MindMapFiber({
  d,
  active,
  flowing,
  gradId,
  filterId,
}: {
  d: string;
  active: boolean;
  flowing: boolean;
  gradId: string;
  filterId: string;
}) {
  const dim = !active && !flowing;
  return (
    <g
      className="transition-opacity duration-700"
      style={{ opacity: dim ? 0.28 : 1 }}
    >
      <path
        d={d}
        fill="none"
        stroke="rgb(6 182 212)"
        strokeWidth={6}
        strokeLinecap="round"
        className="blur-[5px]"
        opacity={active || flowing ? 0.32 : 0.08}
      />
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={active ? 2.1 : 1.35}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter={`url(#${filterId})`}
        strokeDasharray="5 22"
        className={cn(
          "drop-shadow-[0_0_12px_rgba(34,211,238,0.55)]",
          active && "drop-shadow-[0_0_16px_rgba(192,38,211,0.35)]",
        )}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-108"
          dur={flowing ? "4.8s" : "14s"}
          repeatCount="indefinite"
        />
      </path>
      {flowing ? (
        <path
          d={d}
          fill="none"
          stroke="rgb(255 255 255)"
          strokeWidth={0.9}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.75}
          strokeDasharray="2 160"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-162"
            dur="5.5s"
            repeatCount="indefinite"
          />
        </path>
      ) : null}
    </g>
  );
}

function PathEndNode({
  cx,
  cy,
  on,
}: {
  cx: number;
  cy: number;
  on: boolean;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={2.2}
      fill="#ecfeff"
      className={cn(
        "transition-all duration-500",
        on ? "drop-shadow-[0_0_12px_rgba(34,211,238,1)]" : "opacity-40",
      )}
    />
  );
}

function CommandFrameCorners() {
  const corner =
    "pointer-events-none absolute border-violet-400/40 shadow-[0_0_10px_rgba(192,38,211,0.25)]";
  return (
    <>
      <span
        className={cn(corner, "left-3 top-3 h-7 w-7 border-l-2 border-t-2 md:left-5 md:top-5")}
        aria-hidden
      />
      <span
        className={cn(corner, "right-3 top-3 h-7 w-7 border-r-2 border-t-2 md:right-5 md:top-5")}
        aria-hidden
      />
      <span
        className={cn(corner, "bottom-3 left-3 h-7 w-7 border-b-2 border-l-2 md:bottom-5 md:left-5")}
        aria-hidden
      />
      <span
        className={cn(corner, "bottom-3 right-3 h-7 w-7 border-b-2 border-r-2 md:bottom-5 md:right-5")}
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
      className="group/core relative flex size-[7.5rem] shrink-0 items-center justify-center rounded-full outline-none ring-offset-[#0a0514] focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      aria-label="Open neural command interface"
      animate={{ scale: isPulsing ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <motion.span
        className="absolute inset-[-36%] rounded-full bg-[radial-gradient(circle,rgba(192,38,211,0.28)_0%,rgba(34,211,238,0.14)_40%,transparent_70%)] blur-xl"
        animate={{
          opacity: isPulsing ? [0.72, 1, 0.72] : 0.82,
          scale: isPulsing ? [1, 1.06, 1] : 1,
        }}
        transition={{
          duration: isPulsing ? 2.2 : 0,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-[-18%] rounded-full bg-[radial-gradient(ellipse_120%_100%_at_0%_50%,rgba(34,211,238,0.35)_0%,transparent_55%)] blur-md"
        aria-hidden
      />
      <span
        className="absolute inset-[-14%] rounded-full bg-[radial-gradient(circle_at_85%_50%,rgba(232,121,249,0.45)_0%,transparent_50%)] opacity-90 blur-sm animate-neural-orb-breathe"
        aria-hidden
      />
      <span
        className="absolute inset-[-8px] rounded-full shadow-[0_0_56px_-4px_rgba(0,255,255,0.25),0_0_80px_-6px_rgba(192,38,211,0.35)]"
        aria-hidden
      />
      <span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.55)_0%,rgba(34,211,238,0.48)_12%,rgba(59,130,246,0.32)_38%,rgba(45,0,75,0.65)_72%,rgba(2,6,23,0.96)_100%)]"
        style={{
          boxShadow:
            "inset 0 0 48px rgba(34,211,238,0.18), inset 0 2px 14px rgba(255,255,255,0.1)",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-[13%] rounded-full bg-[radial-gradient(circle_at_50%_48%,rgba(15,23,42,0.12)_0%,rgba(2,6,23,0.92)_100%)] backdrop-blur-[3px]"
        aria-hidden
      />
      <svg
        className="absolute inset-[19%] z-[1] text-cyan-200/60"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
      >
        <g
          stroke="currentColor"
          strokeWidth={0.85}
          className="drop-shadow-[0_0_8px_rgba(165,243,252,0.85)]"
        >
          <polygon points="50,18 82,38 72,72 28,72 18,38" opacity={0.95} />
          <line x1="50" y1="18" x2="50" y2="55" opacity={0.85} />
          <line x1="18" y1="38" x2="72" y2="72" opacity={0.65} />
          <line x1="82" y1="38" x2="28" y2="72" opacity={0.65} />
          <line x1="18" y1="38" x2="82" y2="38" opacity={0.5} />
        </g>
      </svg>
      <Sparkles className="relative z-10 size-8 text-cyan-100 drop-shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
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
  const uid = useId().replace(/:/g, "");
  const gradId = `mind-map-${uid}`;
  const filterId = `mind-map-soft-${uid}`;
  const { isPulsing, flowTarget, setOpen } = useOrchestrator();
  const manualDisabled = !signedIn || !configured;

  const applyActive = flowTarget === "apply";
  const bioActive = flowTarget === "bio";
  const netActive = flowTarget === "network";

  return (
    <section
      className="relative -mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0514] via-[#12081f] to-[#050508] shadow-[0_0_72px_-16px_rgba(192,38,211,0.25),inset_0_0_0_1px_rgba(34,211,238,0.1)] md:-mx-8"
      aria-label="Neural strategic command"
      style={{ letterSpacing: "-0.02em" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_0%_50%,rgba(34,211,238,0.12),transparent_50%),radial-gradient(ellipse_80%_70%_at_100%_30%,rgba(168,85,247,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-35 animate-neural-mesh-drift"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 88% 78% at 50% 50%, black 20%, transparent 78%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85"
        aria-hidden
      />

      <CommandFrameCorners />

      <div className="relative z-10 px-4 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10">
        <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-[0.35em] text-cyan-100/55">
          Summary
        </h2>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-0 lg:gap-x-10">
          <div className="flex justify-center lg:col-span-2 lg:justify-end lg:pr-2">
            <NeuralCoreOrb isPulsing={isPulsing} onOpen={() => setOpen(true)} />
          </div>

          <div className="relative min-h-[320px] lg:col-span-3">
            <svg
              className="pointer-events-none absolute bottom-6 left-0 top-6 hidden w-[min(28%,9rem)] lg:block"
              viewBox="0 0 100 300"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#e879f9" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                </linearGradient>
                <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="0.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <MindMapFiber
                d={MIND_MAP_PATHS.apply}
                active={applyActive}
                flowing={isPulsing}
                gradId={gradId}
                filterId={filterId}
              />
              <MindMapFiber
                d={MIND_MAP_PATHS.bio}
                active={bioActive}
                flowing={isPulsing}
                gradId={gradId}
                filterId={filterId}
              />
              <MindMapFiber
                d={MIND_MAP_PATHS.network}
                active={netActive}
                flowing={isPulsing}
                gradId={gradId}
                filterId={filterId}
              />
              <PathEndNode
                cx={PATH_END.apply.cx}
                cy={PATH_END.apply.cy}
                on={applyActive}
              />
              <PathEndNode cx={PATH_END.bio.cx} cy={PATH_END.bio.cy} on={bioActive} />
              <PathEndNode
                cx={PATH_END.network.cx}
                cy={PATH_END.network.cy}
                on={netActive}
              />
            </svg>

            <div className="flex flex-col gap-5 lg:pl-[calc(min(28%,9rem)+0.75rem)]">
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
      </div>

      <p className="relative z-10 border-t border-cyan-500/10 bg-black/35 px-4 py-3 text-center text-xs tracking-[-0.02em] text-cyan-100/45">
        Fibers route orchestration intent into each pillar. Use the{" "}
        <span className="font-medium text-cyan-300/85">neural core</span> for
        the command interface — or add manually via the{" "}
        <span className="text-cyan-200/70">+</span> icon on hover.
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
        "group/card relative overflow-hidden rounded-2xl",
        "border-0 bg-white/[0.035] shadow-none ring-0 backdrop-blur-[14px] backdrop-saturate-150",
        "shadow-[0_12px_48px_-8px_rgba(0,0,0,0.55),0_0_40px_-10px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.07)]",
        highlight &&
          "shadow-[0_14px_52px_-6px_rgba(0,0,0,0.45),0_0_48px_-6px_rgba(34,211,238,0.28),0_0_56px_-8px_rgba(192,38,211,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "transition-shadow duration-500",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.07] via-transparent to-fuchsia-500/[0.04]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-8 top-0 h-full w-1/2 skew-x-[-12deg] bg-gradient-to-l from-cyan-400/[0.06] to-transparent" />

      <div className="relative flex items-center gap-3 px-4 py-3.5 md:gap-4 md:px-5 md:py-4">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none ring-offset-[#0a0514] focus-visible:ring-2 focus-visible:ring-cyan-400/50 md:gap-4"
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-cyan-500/12 to-fuchsia-600/10",
              "shadow-[0_0_24px_rgba(34,211,238,0.28)]",
              highlight && "shadow-[0_0_32px_rgba(34,211,238,0.5)]",
            )}
          >
            <Icon
              className={cn(
                "size-5",
                highlight
                  ? "text-cyan-100 drop-shadow-[0_0_12px_rgba(165,243,252,0.95)]"
                  : "text-cyan-300/85 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]",
              )}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[0.95rem] font-semibold text-zinc-50">
              {title}
            </p>
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 border-0 tabular-nums shadow-[0_0_16px_rgba(34,211,238,0.2)]",
              "bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20",
            )}
          >
            {count}
          </Badge>
          <ChevronRight
            className="size-4 shrink-0 text-cyan-400/50"
            aria-hidden
          />
        </Link>
        <div className="relative z-20 shrink-0">{manual}</div>
      </div>
    </div>
  );
}
