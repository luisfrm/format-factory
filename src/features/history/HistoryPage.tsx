import { FolderOpen, History, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { backend } from "@/lib/backend";
import { cn } from "@/lib/cn";
import { humanBytes, humanDuration, savedPercent } from "@/lib/files";
import { FORMATS } from "@/lib/formats";
import type { Job, JobStatus } from "@/lib/jobs";
import { useQueueStore } from "@/store/queue-store";

type Filter = "all" | "done" | "failed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "done", label: "Completados" },
  { id: "failed", label: "Con error" },
];

function isFinished(status: JobStatus): boolean {
  return status === "done" || status === "failed" || status === "canceled";
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryRow({ job }: { job: Job }) {
  const retry = useQueueStore((state) => state.retry);
  const saved =
    job.outputBytes !== undefined
      ? savedPercent(job.inputBytes, job.outputBytes)
      : null;

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-surface-2/40">
      <div className="flex min-w-0 items-center gap-2.5">
        <Badge tone={job.kind === "video" ? "accent" : "info"}>
          {job.sourceExtension || "?"}
        </Badge>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[12px] font-medium text-text">
            {job.outputName}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-subtle">
            <span>{FORMATS[job.target].label}</span>
            <span className="text-subtle/40">•</span>
            <span>{humanBytes(job.outputBytes ?? job.inputBytes)}</span>
            {job.durationSeconds !== undefined && (
              <>
                <span className="text-subtle/40">•</span>
                <span>{humanDuration(job.durationSeconds)}</span>
              </>
            )}
            <span className="text-subtle/40">•</span>
            <span>{formatDate(job.finishedAt)}</span>
            {job.status === "failed" && (
              <>
                <span className="text-subtle/40">•</span>
                <span className="max-w-[200px] truncate text-danger">
                  {job.error ?? "error desconocido"}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {job.status === "done" ? (
          <Badge tone={saved !== null && saved > 0 ? "success" : "warning"}>
            {saved !== null ? (saved > 0 ? `−${saved}%` : `+${Math.abs(saved)}%`) : "ok"}
          </Badge>
        ) : (
          <Badge tone="danger">{job.status === "canceled" ? "cancelado" : "error"}</Badge>
        )}

        <Button
          size="xs"
          variant="ghost"
          onClick={() => void backend.revealInFolder(job.outputPath)}
        >
          <FolderOpen size={12} />
          Mostrar
        </Button>
        {job.status !== "done" && (
          <Button size="xs" variant="ghost" onClick={() => void retry(job.id)}>
            <RotateCcw size={12} />
            Reintentar
          </Button>
        )}
      </div>
    </li>
  );
}

export function HistoryPage() {
  const jobs = useQueueStore((state) => state.jobs);
  const clearFinished = useQueueStore((state) => state.clearFinished);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState(false);

  const finished = jobs.filter((job) => isFinished(job.status));
  const visible = finished.filter((job) => {
    if (filter === "done") return job.status === "done";
    if (filter === "failed") return job.status !== "done";
    return true;
  });

  const done = finished.filter((job) => job.status === "done");
  const measured = done.filter((job) => job.outputBytes !== undefined);
  const totalOutput = measured.reduce((sum, job) => sum + (job.outputBytes ?? 0), 0);
  const totalSaved = measured.reduce(
    (sum, job) => sum + Math.max(0, job.inputBytes - (job.outputBytes ?? 0)),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
            Registro local
          </span>
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">
            Historial
          </h1>
          <p className="text-[12px] text-muted">
            {done.length} conversiones completadas
            {measured.length > 0
              ? ` · ${humanBytes(totalOutput)} generados · ${humanBytes(totalSaved)} ahorrados`
              : " · sin datos de tamaño todavía"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-control bg-surface-3/60 p-0.5">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1 text-[11px] transition-colors duration-(--dur-fast)",
                  filter === option.id
                    ? "bg-surface-2 text-text shadow-sm"
                    : "text-muted hover:text-text",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            disabled={finished.length === 0}
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={13} />
            Limpiar
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-panel border border-border bg-surface/40">
        {visible.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nada por aquí todavía"
            description="Cuando termines una conversión aparecerá en este registro, con el tamaño final y el ahorro conseguido."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  window.location.hash = "#/";
                }}
              >
                Ir al conversor
              </Button>
            }
          />
        ) : (
          <ul>
            {visible.map((job) => (
              <HistoryRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Vaciar el historial?"
        description="Se ocultarán los registros de conversiones terminadas. Los archivos generados permanecen en disco."
        confirmLabel="Vaciar"
        tone="danger"
        onConfirm={() => {
          clearFinished();
          toast.success("Historial vaciado");
        }}
      />
    </div>
  );
}
