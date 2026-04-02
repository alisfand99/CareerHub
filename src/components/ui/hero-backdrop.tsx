import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Default: modern office — replace via prop or env if you self-host assets. */
export const DEFAULT_CORPORATE_HERO_IMAGE =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=80";

type HeroBackdropProps = {
  children: ReactNode;
  /** Full URL to a wide landscape photo (office / workspace works well). */
  imageUrl?: string;
  className?: string;
};

/**
 * Full-viewport hero: cover image, light blur, navy overlay for readable white UI on top.
 */
export function HeroBackdrop({
  children,
  imageUrl = DEFAULT_CORPORATE_HERO_IMAGE,
  className,
}: HeroBackdropProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center blur-[3px]"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-brand-navy-deep/78"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-brand-navy/55 via-brand-navy-deep/70 to-brand-navy-deep/92"
      />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
