import { cn } from "@/lib/cn";
import { useEngineStatus } from "@/features/engines/use-engine-status";

/**
 * Small health indicator for the external conversion binaries.
 * Collapses to a single status dot when the sidebar is in rail mode.
 */
export function EngineStatusCard({ collapsed }: { collapsed: boolean }) {
  const { loading, available, ffmpeg } = useEngineStatus();

  const ready = ffmpeg?.available ?? false;
  const status = loading ? "idle" : ready ? "ready" : "missing";

  const dot = cn(
    "size-1.5 shrink-0 rounded-full",
    status === "ready" && "bg-success",
    status === "missing" && "bg-warning",
    status === "idle" && "animate-pulse bg-muted",
  );

  if (collapsed) {
    return (
      <div
        className="mb-2 grid h-8 place-items-center"
        title={
          ready
            ? `FFmpeg listo · ${ffmpeg?.version ?? ""}`
            : "FFmpeg no detectado"
        }
      >
        <span className={dot} />
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-control border border-border bg-surface-2/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={dot} />
        <span className="truncate text-[11px] font-medium text-muted">
          {status === "ready" && "Motor listo"}
          {status === "missing" && "Motor no detectado"}
          {status === "idle" && "Verificando motor…"}
        </span>
      </div>
      <p
        className="mt-1 truncate text-[10px] leading-snug text-muted/70"
        title={ffmpeg?.version ?? undefined}
      >
        {!available && "Disponible al ejecutar la app"}
        {available && status === "ready" && (ffmpeg?.version ?? "FFmpeg")}
        {available && status === "missing" && "Instala ffmpeg o usa un sidecar"}
      </p>
    </div>
  );
}
