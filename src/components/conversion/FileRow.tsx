import { AudioLines, Film, X } from "lucide-react";
import { motion } from "motion/react";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { TargetPicker } from "@/components/conversion/TargetPicker";
import { cn } from "@/lib/cn";
import { humanBytes, humanDuration } from "@/lib/files";
import type { StagedFile } from "@/store/converter-store";

type FileRowProps = {
  file: StagedFile;
  onRemove: () => void;
  onTargetChange: (target: StagedFile["target"]) => void;
};

export function FileRow({ file, onRemove, onTargetChange }: FileRowProps) {
  const Icon = file.kind === "video" ? Film : AudioLines;
  const meta = [
    file.extension.toUpperCase(),
    humanBytes(file.bytes),
    file.durationSeconds ? humanDuration(file.durationSeconds) : null,
    file.width && file.height ? `${file.width}×${file.height}` : null,
  ].filter(Boolean) as string[];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "group flex items-center gap-3 rounded-card border border-border bg-surface/50 px-2.5 py-2",
        "transition-colors duration-(--dur-fast) hover:border-border-strong hover:bg-surface-2/60",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-control border",
          file.kind === "video"
            ? "border-accent/20 bg-accent-soft text-accent"
            : "border-info/20 bg-info/10 text-info",
        )}
      >
        <Icon size={15} strokeWidth={1.8} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="truncate text-[12px] font-medium text-text"
          title={file.path}
        >
          {file.name}
        </span>

        {file.probing ? (
          <Skeleton className="mt-1 h-2.5 w-40" />
        ) : (
          <span className="flex items-center gap-1.5 truncate font-mono text-[10px] text-subtle">
            {meta.map((item, index) => (
              <span key={item} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-subtle/40">•</span>}
                {item}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="hidden font-mono text-[10px] text-subtle sm:inline">→</span>
        <TargetPicker
          value={file.target}
          source={file.kind}
          onChange={onTargetChange}
          label={`Formato de salida para ${file.name}`}
        />
        <IconButton
          size="sm"
          tone="danger"
          label={`Quitar ${file.name}`}
          onClick={onRemove}
          withTooltip={false}
          className="opacity-0 transition-opacity duration-(--dur-fast) group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X size={14} />
        </IconButton>
      </div>
    </motion.li>
  );
}
