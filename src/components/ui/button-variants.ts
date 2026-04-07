import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-mono text-sm font-medium whitespace-nowrap transition-all duration-500 outline-none select-none focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-500/25 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "normal-case tracking-normal border-cyan-600/20 bg-cyan-600 text-white shadow-sm hover:border-cyan-700/30 hover:bg-cyan-700",
        outline:
          "text-[0.7rem] uppercase tracking-[0.22em] border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm hover:border-cyan-400/50 hover:bg-cyan-50/80 hover:text-slate-900 aria-expanded:bg-slate-50",
        secondary:
          "normal-case tracking-normal border-slate-200 bg-slate-100 text-slate-800 hover:border-slate-300 hover:bg-slate-200/90",
        ghost:
          "normal-case tracking-normal text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100",
        destructive:
          "normal-case tracking-normal border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus-visible:ring-red-400/25",
        link: "border-transparent text-sm normal-case tracking-normal text-cyan-700 underline-offset-4 hover:text-cyan-800 hover:underline",
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
        /** Multiline labels (e.g. orchestrator quick actions); do not fix height. */
        multiline:
          "h-auto min-h-10 items-start justify-start gap-2 whitespace-normal px-3 py-2.5 text-left text-[0.72rem] leading-snug has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
