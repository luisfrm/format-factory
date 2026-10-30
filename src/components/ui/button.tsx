import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 rounded-control",
    "font-medium whitespace-nowrap",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-(--dur-fast) ease-standard",
    "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_16px_-6px_var(--color-accent)] hover:bg-accent-hover",
        secondary:
          "border border-border-strong bg-surface-2 text-text hover:border-white/20 hover:bg-surface-3",
        subtle:
          "bg-surface-2/60 text-text hover:bg-surface-3",
        ghost: "text-muted hover:bg-surface-2 hover:text-text",
        danger: "text-danger hover:bg-danger/10",
      },
      size: {
        xs: "h-6 px-2 text-[11px]",
        sm: "h-7 px-2.5 text-[12px]",
        md: "h-9 px-3.5 text-[13px]",
        lg: "h-10 px-5 text-[13px] font-semibold",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
