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
import { toast } from "sonner";
import { TargetPicker } from "@/components/conversion/TargetPicker";
import { IconButton } from "@/components/ui/icon-button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { backend } from "@/lib/backend";
import { cn } from "@/lib/cn";
import { humanBytes, humanClock, humanDuration, savedPercent } from "@/lib/files";
import type { StagedFile } from "@/store/converter-store";
import { useConverterStore } from "@/store/converter-store";
import { useQueueStore } from "@/store/queue-store";

type BatchRowProps = {
  file: StagedFile;
};

export function BatchRow({ file }: BatchRowProps) {
  const job = useQueueStore((state) =>
    file.jobId ? state.jobs.find((item) => item.id === file.jobId) : undefined,
  );
  const setTarget = useConverterStore((state) => state.setTarget);
  const removeFile = useConverterStore((state) => state.removeFile);
  const cancel = useQueueStore((state) => state.cancel);
  const retry = useQueueStore((state) => state.retry);

  const Icon = file.kind === "video" ? Film : AudioLines;
  const active = job?.status === "running" || job?.status === "queued";
  const failed = job?.status === "failed" || job?.status === "canceled";
  const done = job?.status === "done";
  const saved =
    done && job?.outputBytes !== undefined
      ? savedPercent(file.bytes, job.outputBytes)
      : null;

  async function handleReveal() {
    if (!job) return;
    try {
      await backend.revealInFolder(job.outputPath);
    } catch {
      toast.error("No se pudo abrir la carpeta");
    }
  }

  function handleRemove() {
    if (job && active) {
      void cancel(job.id);
      return;
    }
    removeFile(file.id);
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "group flex flex-col gap-1.5 rounded-card border px-2.5 py-2",
        "transition-colors duration-(--dur-fast)",
        job?.status === "running"
          ? "border-accent/25 bg-accent-soft/20"
          : done
            ? "border-success/20 bg-surface/50"
            : failed
              ? "border-danger/25 bg-danger/[0.04]"
              : "border-border bg-surface/50 hover:border-border-strong hover:bg-surface-2/60",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-control border transition-colors duration-(--dur-base)",
            done
              ? "border-success/25 bg-success/10 text-success"
              : failed
                ? "border-danger/25 bg-danger/10 text-danger"
                : file.kind === "video"
                  ? "border-accent/20 bg-accent-soft text-accent"
                  : "border-info/20 bg-info/10 text-info",
          )}
        >
          {done ? (
            <Check size={15} strokeWidth={2.6} />
          ) : failed ? (
            <AlertTriangle size={14} strokeWidth={2.2} />
          ) : (
            <Icon size={15} strokeWidth={1.8} />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="truncate text-[12px] font-medium text-text"
              title={file.path}
            >
              {file.name}
            </span>
            {done && job && (
              <>
                <span className="shrink-0 text-[10px] text-subtle">→</span>
                <span className="truncate font-mono text-[10px] text-success">
                  {job.outputName}
                </span>
              </>
            )}
          </div>

          {file.probing ? (
            <Skeleton className="mt-1 h-2.5 w-40" />
          ) : (
            <div className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[10px]">
              <span className="text-subtle">{file.extension.toUpperCase()}</span>
              <span className="text-subtle/40">•</span>
              <span className="text-subtle">{humanBytes(file.bytes)}</span>
              {file.durationSeconds ? (
                <>
                  <span className="text-subtle/40">•</span>
                  <span className="text-subtle">
                    {humanDuration(file.durationSeconds)}
                  </span>
                </>
              ) : null}

              <span className="text-subtle/40">•</span>

              {!job && <span className="text-muted">Listo para convertir</span>}

              {job?.status === "queued" && (
                <span className="text-muted">En espera</span>
              )}

              {job?.status === "running" && (
                <span className="flex items-center gap-1.5 text-accent">
                  <span>Procesando</span>
                  {job.speed !== undefined && (
                    <>
                      <span className="text-subtle/40">•</span>
                      <span>{job.speed.toFixed(1)}x</span>
                    </>
                  )}
                  {job.etaSeconds !== undefined && (
                    <>
                      <span className="text-subtle/40">•</span>
                      <span>ETA {humanClock(job.etaSeconds)}</span>
                    </>
                  )}
                </span>
              )}

              {done && job && (
                <span className="flex items-center gap-1.5 text-success">
                  <span>Completado</span>
                  {job.outputBytes !== undefined && saved !== null && (
                    <>
                      <span className="text-subtle/40">•</span>
                      <span>{humanBytes(job.outputBytes)}</span>
                      <span className="text-subtle/40">•</span>
                      <span>{saved > 0 ? `−${saved}%` : `+${Math.abs(saved)}%`}</span>
                    </>
                  )}
                </span>
              )}

              {job?.status === "canceled" && (
                <span className="text-muted">Cancelado</span>
              )}

              {job?.status === "failed" && (
                <span
                  className="max-w-[260px] truncate text-danger"
                  title={job.error}
                >
                  {job.error ?? "Error al convertir"}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {done && (
            <button
              type="button"
              onClick={() => void handleReveal()}
              className="hidden items-center gap-1 rounded-control px-1.5 py-1 font-mono text-[10px] text-muted transition-colors hover:bg-surface-3 hover:text-text group-hover:flex"
            >
              <FolderOpen size={12} />
              Mostrar
            </button>
          )}

          {failed && job && (
            <button
              type="button"
              onClick={() => void retry(job.id)}
              className="flex items-center gap-1 rounded-control px-1.5 py-1 font-mono text-[10px] text-muted transition-colors hover:bg-surface-3 hover:text-text"
            >
              <RotateCcw size={12} />
              Reintentar
            </button>
          )}

          <TargetPicker
            value={file.target}
            source={file.kind}
            disabled={active}
            onChange={(target) => setTarget(file.id, target)}
            label={`Formato de salida para ${file.name}`}
          />

          <IconButton
            size="sm"
            tone={active ? "danger" : "default"}
            label={active ? `Cancelar ${file.name}` : `Quitar ${file.name}`}
            onClick={handleRemove}
            withTooltip={false}
            className="opacity-0 transition-opacity duration-(--dur-fast) group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X size={14} />
          </IconButton>
        </div>
      </div>

      {job?.status === "running" && (
        <div className="flex items-center gap-2 pl-[42px]">
          <Progress value={job.progress} status="active" />
          <span className="w-8 shrink-0 text-right font-mono text-[10px] font-semibold text-accent">
            {Math.round(job.progress)}%
          </span>
        </div>
      )}
    </motion.li>
  );
}
