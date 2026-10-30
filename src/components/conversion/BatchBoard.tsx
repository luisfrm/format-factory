import { ArrowRight, FolderOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { BatchRow } from "@/components/conversion/BatchRow";
import { TargetPicker } from "@/components/conversion/TargetPicker";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Progress } from "@/components/ui/progress";
import { pendingFiles, summarizeBatch } from "@/lib/batch";
import { humanBytes } from "@/lib/files";
import { qualityLabel } from "@/lib/formats";
import { useConverterStore } from "@/store/converter-store";
import { useQueueStore } from "@/store/queue-store";

export function BatchBoard() {
  const files = useConverterStore((state) => state.files);
  const quality = useConverterStore((state) => state.quality);
  const outputDirectory = useConverterStore((state) => state.outputDirectory);
  const setOutputDirectory = useConverterStore((state) => state.setOutputDirectory);
  const pickOutputDirectory = useConverterStore(
    (state) => state.pickOutputDirectory,
  );
  const applyTargetToAll = useConverterStore((state) => state.applyTargetToAll);
  const attachJobs = useConverterStore((state) => state.attachJobs);
  const clearFiles = useConverterStore((state) => state.clearFiles);

  const jobs = useQueueStore((state) => state.jobs);
  const start = useQueueStore((state) => state.start);
  const retry = useQueueStore((state) => state.retry);

  const summary = summarizeBatch(files, jobs);
  const pending = pendingFiles(files);
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const videos = files.filter((file) => file.kind === "video").length;
  // "Apply to all" only offers one family when the whole batch is locked to it.
  const sharedOutputKind = files.every(
    (file) => file.outputKind === files[0]?.outputKind,
  )
    ? (files[0]?.outputKind ?? null)
    : null;

  const jobsById = useMemo(
    () => new Map(jobs.map((job) => [job.id, job])),
    [jobs],
  );

  const retryable = files.filter((file) => {
    const job = file.jobId ? jobsById.get(file.jobId) : undefined;
    return job?.status === "failed" || job?.status === "canceled";
  });

  if (files.length === 0) return null;

  async function handleConvert() {
    const batch = pendingFiles(files);
    if (batch.length === 0) return;

    const created = await start(batch, quality, outputDirectory);
    attachJobs(
      batch.map((file, index) => ({ fileId: file.id, jobId: created[index].id })),
    );

    toast.success(
      `${created.length} ${created.length === 1 ? "conversión en marcha" : "conversiones en marcha"}`,
      { description: "Puedes seguir añadiendo archivos al lote." },
    );
  }

  async function handleRetryAll() {
    for (const file of retryable) {
      if (file.jobId) await retry(file.jobId);
    }
  }

  return (
    <section className="overflow-hidden rounded-panel border border-border bg-surface/40">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-3.5 py-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[12px] font-semibold text-text">
            {files.length} {files.length === 1 ? "archivo" : "archivos"}
          </h2>
          <span className="font-mono text-[10px] text-subtle">
            {humanBytes(totalBytes)}
            {videos > 0 && files.length > videos
              ? ` · ${videos} video · ${files.length - videos} audio`
              : ""}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden font-mono text-[10px] uppercase tracking-wide text-subtle sm:inline">
            Aplicar a todos
          </span>
          <TargetPicker
            value={files[0].target}
            source="video"
            outputKind={sharedOutputKind}
            onChange={applyTargetToAll}
            disabled={summary.active > 0}
            label="Aplicar formato de salida a todos los archivos"
          />
          <IconButton
            size="sm"
            tone="danger"
            label={
              summary.active > 0
                ? "Espera a que terminen las conversiones"
                : "Quitar todos los archivos"
            }
            onClick={clearFiles}
            disabled={summary.active > 0}
            withTooltip
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      </header>

      {summary.started && (
        <div className="border-b border-border px-3.5 py-2">
          <Progress
            value={summary.percent}
            status={summary.allDone ? "done" : "active"}
            size="md"
          />
          <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
            <span className="text-subtle">
              {summary.done} de {summary.total} completados
              {summary.active > 0 && ` · ${summary.active} en curso`}
              {summary.failed > 0 && (
                <span className="text-danger"> · {summary.failed} con error</span>
              )}
            </span>
            <span className={summary.allDone ? "text-success" : "text-accent"}>
              {summary.allDone
                ? "Lote completado"
                : `${Math.round(summary.percent)}%`}
            </span>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-1.5 p-2.5">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <BatchRow key={file.id} file={file} />
          ))}
        </AnimatePresence>
      </ul>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => void pickOutputDirectory()}
          className="flex items-center gap-1.5 rounded-control px-1 py-1 font-mono text-[10px] text-muted transition-colors hover:text-text"
        >
          <FolderOpen size={13} className="text-subtle" />
          <span className="max-w-[240px] truncate">
            {outputDirectory ?? "Misma carpeta que el original"}
          </span>
        </button>

        {outputDirectory && (
          <button
            type="button"
            onClick={() => setOutputDirectory(null)}
            className="font-mono text-[10px] text-subtle hover:text-text"
          >
            restablecer
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 font-mono text-[10px] text-subtle sm:flex">
            <Sparkles size={11} className="text-accent" />
            {qualityLabel(quality)}
          </span>

          {pending.length > 0 ? (
            <Button variant="primary" onClick={() => void handleConvert()}>
              Convertir {pending.length}
              <ArrowRight size={14} strokeWidth={2.2} />
            </Button>
          ) : summary.active > 0 ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Convirtiendo…
            </span>
          ) : retryable.length > 0 ? (
            <Button variant="secondary" onClick={() => void handleRetryAll()}>
              Reintentar {retryable.length}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Button variant="secondary" onClick={clearFiles}>
                <Plus size={14} strokeWidth={2.4} />
                Nueva conversión
              </Button>
            </motion.div>
          )}
        </div>
      </footer>
    </section>
  );
}
