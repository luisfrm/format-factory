import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-xs bg-surface-3/70",
        className,
      )}
    />
  );
}
