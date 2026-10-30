import {
  AlertTriangle,
  AudioLines,
  Check,
  Film,
  FolderOpen,
  RotateCcw,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Progress } from "@/components/ui/progress";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/cn";
import { humanBytes, humanClock, savedPercent } from "@/lib/files";
import { FORMATS } from "@/lib/formats";
import type { Job } from "@/lib/jobs";

type QueueItemProps = {
  job: Job;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onReveal: (job: Job) => void;
  onRetry: (id: string) => void;
};

const STATUS_LABEL: Record<Job["status"], string> = {
  queued: "En espera",
  running: "Procesando",
  done: "Completado",
  failed: "Error",
  canceled: "Cancelado",
};

export function QueueItem({
  job,
  onCancel,
  onRemove,
  onReveal,
  onRetry,
}: QueueItemProps) {
  const Icon = job.kind === "video" ? Film : AudioLines;
  const target = FORMATS[job.target];
  const running = job.status === "running";
  const finished = job.status === "done";
  const failed = job.status === "failed" || job.status === "canceled";
  const saved =
    job.outputBytes !== undefined ? savedPercent(job.inputBytes, job.outputBytes) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "flex flex-col gap-2 rounded-card border px-2.5 py-2",
        "transition-colors duration-(--dur-fast)",
        running
          ? "border-accent/25 bg-accent-soft/20"
          : "border-border bg-surface/50 hover:bg-surface-2/50",
        finished && "opacity-95",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-control border",
            finished
              ? "border-success/25 bg-success/10 text-success"
              : failed
                ? "border-danger/25 bg-danger/10 text-danger"
                : job.kind === "video"
                  ? "border-accent/20 bg-accent-soft text-accent"
                  : "border-info/20 bg-info/10 text-info",
          )}
        >
          <Icon size={15} strokeWidth={1.8} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="truncate text-[12px] font-medium text-text"
              title={job.inputPath}
            >
              {job.sourceName}
            </span>
            <span className="shrink-0 text-[10px] text-subtle">→</span>
            <span className="truncate font-mono text-[10px] text-muted">
              {job.outputName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-subtle">
            <span
              className={cn(
                "flex items-center gap-1",
                finished && "text-success",
                running && "text-accent",
                failed && "text-danger",
              )}
            >
              {running && <StatusDot status="active" pulse />}
              {finished && <Check size={11} strokeWidth={3} />}
              {failed && <AlertTriangle size={11} strokeWidth={2.4} />}
              {STATUS_LABEL[job.status]}
            </span>
            <span className="text-subtle/40">•</span>
            <span className="uppercase">{target.label}</span>

            {running && job.speed !== undefined && (
              <>
                <span className="text-subtle/40">•</span>
                <span>{job.speed.toFixed(1)}x</span>
              </>
            )}
            {running && job.etaSeconds !== undefined && (
              <>
                <span className="text-subtle/40">•</span>
                <span>ETA {humanClock(job.etaSeconds)}</span>
              </>
            )}
            {finished && job.outputBytes !== undefined && (
              <>
                <span className="text-subtle/40">•</span>
                <span>{humanBytes(job.outputBytes)}</span>
                {saved !== null && (
                  <>
                    <span className="text-subtle/40">•</span>
                    <span className={saved > 0 ? "text-success" : "text-warning"}>
                      {saved > 0 ? `−${saved}%` : `+${Math.abs(saved)}%`}
                    </span>
                  </>
                )}
              </>
            )}
            {job.error && (
              <>
                <span className="text-subtle/40">•</span>
                <span className="max-w-[220px] truncate text-danger">{job.error}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {finished && (
            <Button size="xs" variant="subtle" onClick={() => onReveal(job)}>
              <FolderOpen size={12} />
              Mostrar
            </Button>
          )}
          {failed && (
            <Button size="xs" variant="subtle" onClick={() => onRetry(job.id)}>
              <RotateCcw size={12} />
              Reintentar
            </Button>
          )}
          {(running || job.status === "queued") && (
            <IconButton
              size="sm"
              tone="danger"
              label={running ? "Cancelar conversión" : "Quitar de la cola"}
              onClick={() => onCancel(job.id)}
              withTooltip={false}
            >
              <X size={13} />
            </IconButton>
          )}
          {(finished || failed) && (
            <IconButton
              size="sm"
              label="Quitar del historial"
              onClick={() => onRemove(job.id)}
              withTooltip={false}
            >
              <X size={13} />
            </IconButton>
          )}
        </div>
      </div>

      {running && (
        <div className="flex items-center gap-2 pl-[42px]">
          <Progress value={job.progress} status="active" />
          <span className="w-9 shrink-0 text-right font-mono text-[10px] font-semibold text-accent">
            {Math.round(job.progress)}%
          </span>
        </div>
      )}

      {job.status === "queued" && (
        <div className="flex items-center gap-2 pl-[42px]">
          <Badge tone="neutral" className="font-normal normal-case tracking-normal">
            esperando turno
          </Badge>
          <span className="font-mono text-[10px] text-subtle">
            {humanBytes(job.inputBytes)}
          </span>
        </div>
      )}
    </motion.li>
  );
}
