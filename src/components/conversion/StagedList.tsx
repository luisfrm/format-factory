import { ArrowRight, FolderOpen, Sparkles, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { FileRow } from "@/components/conversion/FileRow";
import { TargetPicker } from "@/components/conversion/TargetPicker";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { humanBytes } from "@/lib/files";
import { qualityLabel } from "@/lib/formats";
import { useConverterStore } from "@/store/converter-store";
import { useQueueStore } from "@/store/queue-store";

export function StagedList() {
  const files = useConverterStore((state) => state.files);
  const quality = useConverterStore((state) => state.quality);
  const outputDirectory = useConverterStore((state) => state.outputDirectory);
  const removeFile = useConverterStore((state) => state.removeFile);
  const setTarget = useConverterStore((state) => state.setTarget);
  const applyTargetToAll = useConverterStore((state) => state.applyTargetToAll);
  const clearFiles = useConverterStore((state) => state.clearFiles);
  const pickOutputDirectory = useConverterStore(
    (state) => state.pickOutputDirectory,
  );
  const start = useQueueStore((state) => state.start);

  if (files.length === 0) return null;

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const probing = files.some((file) => file.probing);
  const videos = files.filter((file) => file.kind === "video").length;

  async function handleConvert() {
    const count = files.length;
    clearFiles();
    await start(files, quality, outputDirectory);
    toast.success(`${count} ${count === 1 ? "conversión" : "conversiones"} en marcha`, {
      description: `Calidad ${qualityLabel(quality).toLowerCase()} · se guardan en ${
        outputDirectory ?? "la carpeta original"
      }`,
    });
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
            onChange={applyTargetToAll}
            label="Aplicar formato de salida a todos los archivos"
          />
          <IconButton
            size="sm"
            tone="danger"
            label="Quitar todos los archivos"
            onClick={clearFiles}
            withTooltip
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      </header>

      <ul className="flex flex-col gap-1.5 p-2.5">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
              onTargetChange={(target) => setTarget(file.id, target)}
            />
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

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1 font-mono text-[10px] text-subtle sm:flex">
            <Sparkles size={11} className="text-accent" />
            {qualityLabel(quality)}
          </span>
          <Button
            variant="primary"
            size="md"
            disabled={probing}
            onClick={() => void handleConvert()}
          >
            Convertir {files.length}
            <ArrowRight size={14} strokeWidth={2.2} />
          </Button>
        </div>
      </footer>

      {probing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-border px-3.5 py-1.5 font-mono text-[10px] text-subtle"
        >
          Analizando archivos…
        </motion.div>
      )}
    </section>
  );
}
