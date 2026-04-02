"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useOrchestrator } from "@/components/orchestrator/orchestrator-context";
import { cn } from "@/lib/utils";

/**
 * Compact neural core on non-dashboard routes — opens the same command panel.
 */
export function OrchestratorFloatingCore() {
  const pathname = usePathname();
  const { open, setOpen, isPulsing } = useOrchestrator();
  const onDashboard = pathname === "/";

  if (onDashboard) return null;

  return (
    <motion.button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-[3.75rem] items-center justify-center rounded-full md:bottom-8 md:right-8 md:size-16",
        "border-0 bg-transparent shadow-[0_0_40px_-6px_rgba(34,211,238,0.45),0_0_60px_-8px_rgba(168,85,247,0.25)]",
        "outline-none ring-offset-[#050508] focus-visible:ring-2 focus-visible:ring-cyan-400/70",
        open && "pointer-events-none scale-90 opacity-0",
      )}
      aria-label="Open neural command interface"
      animate={{ scale: isPulsing ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <motion.span
        className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.35)_0%,rgba(168,85,247,0.15)_45%,transparent_70%)] blur-md"
        animate={{
          opacity: isPulsing ? [0.7, 1, 0.7] : 0.85,
          scale: isPulsing ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: isPulsing ? 1.35 : 0,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45)_0%,rgba(34,211,238,0.5)_18%,rgba(59,130,246,0.3)_45%,rgba(88,28,135,0.55)_100%)]"
        style={{
          boxShadow:
            "inset 0 0 24px rgba(34,211,238,0.12), 0 0 28px rgba(34,211,238,0.35)",
        }}
        aria-hidden
      />
      <span
        className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(2,6,23,0.88)_0%,rgba(15,23,42,0.4)_100%)] backdrop-blur-[2px]"
        aria-hidden
      />
      <Sparkles className="relative z-10 size-6 text-cyan-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.75)] md:size-7" />
    </motion.button>
  );
}
