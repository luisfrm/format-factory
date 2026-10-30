import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name. Also used as the tooltip label. */
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "danger" | "accent";
  withTooltip?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      size = "md",
      tone = "default",
      withTooltip = true,
      className,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    const button = (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={withTooltip ? undefined : label}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-control",
          "text-muted transition-[background-color,color,transform] duration-(--dur-fast) ease-standard",
          "hover:bg-surface-3 hover:text-text active:scale-95",
          "disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "size-7" : "size-8",
          tone === "danger" && "hover:bg-danger/12 hover:text-danger",
          tone === "accent" && "text-accent hover:bg-accent-soft hover:text-accent-bright",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );

    if (!withTooltip) return button;

    return (
      <Tooltip label={label}>
        <span className="inline-flex">{button}</span>
      </Tooltip>
    );
  },
);
IconButton.displayName = "IconButton";
