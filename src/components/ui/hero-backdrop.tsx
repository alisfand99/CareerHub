import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroBackdropProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Full-viewport canvas aligned with app shell: light slate, soft cyan accent.
 */
export function HeroBackdrop({ children, className }: HeroBackdropProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-slate-50 text-slate-900",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-amber-200/25 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 20%, black, transparent)",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
