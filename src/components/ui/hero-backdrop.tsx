import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroBackdropProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Full-viewport canvas aligned with app shell: near-black, soft cyan/amber glow.
 */
export function HeroBackdrop({ children, className }: HeroBackdropProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-[#050505] text-white",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-amber-500/10 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
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
