import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: Readonly<EmptyStateProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-6" : "gap-3 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-card border border-border bg-surface-2 text-subtle",
          compact ? "size-9" : "size-12",
        )}
      >
        <Icon size={compact ? 16 : 20} strokeWidth={1.6} />
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium text-text", compact ? "text-[12px]" : "text-[13px]")}>
          {title}
        </p>
        <p className="mx-auto max-w-xs text-[11px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
