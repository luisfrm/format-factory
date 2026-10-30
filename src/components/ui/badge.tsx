import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5",
    "font-mono text-[10px] font-bold uppercase leading-none tracking-[0.06em]",
    "whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-surface-2 text-muted",
        accent: "border-accent/30 bg-accent-soft text-accent-bright",
        info: "border-info/30 bg-info/10 text-info",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        danger: "border-danger/30 bg-danger/10 text-danger",
        outline: "border-border-strong bg-transparent text-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
