import { Inbox, PauseCircle, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { QueueItem } from "@/components/conversion/QueueItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { backend } from "@/lib/backend";
import { cn } from "@/lib/cn";
import { humanClock } from "@/lib/files";
import {
  countJobs,
  queueEtaSeconds,
  sortJobs,
  type Job,
} from "@/lib/jobs";
import { useQueueStore } from "@/store/queue-store";

type QueuePanelProps = {
  variant?: "dock" | "page";
  className?: string;
};

export function QueuePanel({ variant = "dock", className }: QueuePanelProps) {
  const jobs = useQueueStore((state) => state.jobs);
  const cancel = useQueueStore((state) => state.cancel);
  const cancelAll = useQueueStore((state) => state.cancelAll);
  const remove = useQueueStore((state) => state.remove);
  const clearFinished = useQueueStore((state) => state.clearFinished);

  const [confirmCancelAll, setConfirmCancelAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = countJobs(jobs);
  const ordered = sortJobs(jobs);
  const visible = variant === "dock" ? ordered.slice(0, 5) : ordered;
  const eta = queueEtaSeconds(jobs);
  const finished = counts.done + counts.failed + counts.canceled;

  async function handleReveal(job: Job) {
    try {
      await backend.revealInFolder(job.outputPath);
    } catch {
      toast.error("No se pudo abrir la carpeta");
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-panel border border-border bg-surface/50",
        variant === "dock" && "glass",
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          {counts.running > 0 ? (
            <StatusDot status="active" pulse />
          ) : (
            <StatusDot status={counts.failed > 0 ? "error" : "idle"} />
          )}
          <h2 className="text-[12px] font-semibold text-text">
            Cola de conversión
          </h2>
          <Badge tone="neutral">{counts.total} trabajos</Badge>
          {counts.active > 0 && (
            <span className="font-mono text-[10px] text-accent">
              {counts.active} en curso
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {counts.active > 0 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setConfirmCancelAll(true)}
            >
              <PauseCircle size={12} />
              Cancelar todo
            </Button>
          )}
          {finished > 0 && (
            <Button size="xs" variant="ghost" onClick={() => setConfirmClear(true)}>
              <Trash2 size={12} />
              Limpiar
            </Button>
          )}
        </div>
      </header>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          compact
          title="Sin conversiones todavía"
          description="Los trabajos que inicies aparecerán aquí con su progreso en tiempo real."
        />
      ) : (
        <ul
          className={cn(
            "flex flex-col gap-1.5 p-2.5",
            variant === "dock" && "max-h-[300px] overflow-y-auto",
          )}
        >
          <AnimatePresence initial={false}>
            {visible.map((job) => (
              <QueueItem
                key={job.id}
                job={job}
                onCancel={(id) => void cancel(id)}
                onRemove={remove}
                onReveal={(item) => void handleReveal(item)}
                onRetry={(id) => void useQueueStore.getState().retry(id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-3.5 py-1.5 font-mono text-[10px] text-subtle">
        <span>
          {counts.done} de {counts.total} completadas
        </span>
        {eta !== null && counts.active > 0 && (
          <>
            <span className="text-subtle/40">•</span>
            <span>restante {humanClock(eta)}</span>
          </>
        )}
        <span className="ml-auto">1 trabajo a la vez</span>
      </footer>

      <ConfirmDialog
        open={confirmCancelAll}
        onOpenChange={setConfirmCancelAll}
        title="¿Cancelar todas las conversiones?"
        description="Los archivos que ya se están procesando se descartarán y no se guardarán parciales."
        confirmLabel="Cancelar todo"
        cancelLabel="Seguir"
        tone="danger"
        onConfirm={() => void cancelAll()}
      />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="¿Limpiar los trabajos terminados?"
        description="Se quitarán de la cola los trabajos completados, cancelados y fallidos. Los archivos generados no se borran."
        confirmLabel="Limpiar"
        onConfirm={clearFinished}
      />
    </section>
  );
}
