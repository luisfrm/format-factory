import { FolderOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { DropZone } from "@/components/conversion/DropZone";
import { PresetGrid } from "@/components/conversion/PresetGrid";
import { QueuePanel } from "@/components/conversion/QueuePanel";
import { StagedList } from "@/components/conversion/StagedList";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/formats";
import { useConverterStore } from "@/store/converter-store";
import { useQueueStore } from "@/store/queue-store";

export function HomePage() {
  const navigate = useNavigate();
  const files = useConverterStore((state) => state.files);
  const quality = useConverterStore((state) => state.quality);
  const setQuality = useConverterStore((state) => state.setQuality);
  const outputDirectory = useConverterStore((state) => state.outputDirectory);
  const pickOutputDirectory = useConverterStore(
    (state) => state.pickOutputDirectory,
  );
  const jobCount = useQueueStore((state) => state.jobs.length);
  const hasActiveJobs = useQueueStore((state) =>
    state.jobs.some(
      (job) => job.status === "running" || job.status === "queued",
    ),
  );

  const hasFiles = files.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
            Format Factory Engine
          </span>
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-text">
            Conversión universal
          </h1>
          <p className="text-[12px] text-muted">
            Suelta video o audio, elige el destino y convierte. Sin límites de lote.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<QualityPreset>
            value={quality}
            options={QUALITY_PRESETS.map((preset) => ({
              value: preset.id,
              label: preset.label,
            }))}
            onChange={setQuality}
            ariaLabel="Calidad de conversión"
          />

          <button
            type="button"
            onClick={() => void pickOutputDirectory()}
            className="flex h-8 max-w-[260px] items-center gap-1.5 rounded-control border border-border bg-surface px-2.5 font-mono text-[10px] text-muted transition-colors duration-(--dur-fast) hover:border-border-strong hover:text-text"
          >
            <FolderOpen size={13} className="shrink-0 text-subtle" />
            <span className="truncate">
              {outputDirectory ?? "Misma carpeta"}
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="popLayout" initial={false}>
        {hasFiles ? (
          <motion.div
            key="staged"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col gap-3"
          >
            <DropZone compact />
            <StagedList />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <DropZone />
          </motion.div>
        )}
      </AnimatePresence>

      {hasActiveJobs && <QueuePanel variant="dock" />}

      {!hasFiles && <PresetGrid />}

      {jobCount > 0 && (
        <button
          type="button"
          onClick={() => navigate("/queue")}
          className="text-center font-mono text-[10px] text-subtle transition-colors hover:text-text"
        >
          Ver cola completa y registros →
        </button>
      )}
    </div>
  );
}
