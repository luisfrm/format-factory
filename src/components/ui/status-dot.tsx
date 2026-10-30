import { cn } from "@/lib/cn";

type StatusDotProps = {
  status: "idle" | "active" | "success" | "warning" | "error";
  className?: string;
  /** Adds the expanding ring used while encoding. */
  pulse?: boolean;
};

const COLORS: Record<StatusDotProps["status"], string> = {
  idle: "bg-subtle",
  active: "bg-accent-bright",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-danger",
};

export function StatusDot({ status, pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60",
            COLORS[status],
          )}
        />
      )}
      <span className={cn("relative size-2 rounded-full", COLORS[status])} />
    </span>
  );
}
