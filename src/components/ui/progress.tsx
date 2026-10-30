import { cn } from "@/lib/cn";
import { clampPercent } from "@/lib/jobs";

type ProgressProps = {
  value: number;
  status?: "active" | "done" | "error";
  size?: "sm" | "md";
  className?: string;
  /** Adds the leading glow used on active encodes. */
  glow?: boolean;
};

export function Progress({
  value,
  status = "active",
  size = "sm",
  className,
  glow = true,
}: ProgressProps) {
  const percent = clampPercent(value);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-3/80",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width,background-color] duration-(--dur-slow) ease-linear",
          status === "active" && "bg-accent-bright",
          status === "done" && "bg-success",
          status === "error" && "bg-danger",
          glow && status === "active" && "shadow-[0_0_8px_var(--color-accent-bright)]",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
