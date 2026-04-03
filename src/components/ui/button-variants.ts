import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-mono text-sm font-medium whitespace-nowrap transition-all duration-500 outline-none select-none focus-visible:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400/25 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "normal-case tracking-normal border-cyan-400/50 bg-cyan-400/[0.12] text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-400/20 hover:text-white",
        outline:
          "text-[0.7rem] uppercase tracking-[0.22em] border-white/10 bg-white/5 text-white/90 backdrop-blur-sm hover:border-cyan-500/35 hover:bg-white/[0.08] hover:text-white aria-expanded:bg-white/[0.08]",
        secondary:
          "normal-case tracking-normal border-white/10 bg-white/[0.06] text-white/85 hover:border-white/15 hover:bg-white/[0.1]",
        ghost:
          "normal-case tracking-normal text-white/70 hover:bg-white/[0.06] hover:text-white aria-expanded:bg-white/[0.06]",
        destructive:
          "normal-case tracking-normal border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/40 hover:bg-red-500/15 focus-visible:ring-red-400/25",
        link: "border-transparent text-sm normal-case tracking-normal text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
