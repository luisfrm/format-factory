import { useEngineStatus } from "@/features/engines/use-engine-status";
import { StatusDot } from "@/components/ui/status-dot";

/**
 * Engine health, collapsed to a single dot when the sidebar is in rail mode.
 */
export function EngineStatusCard({ collapsed }: { collapsed: boolean }) {
  const { loading, native, ffmpeg } = useEngineStatus();

  const ready = ffmpeg?.available ?? false;
  const status = loading ? "idle" : ready ? "success" : native ? "warning" : "idle";

  const title = loading
    ? "Verificando motor…"
    : ready
      ? "FFmpeg listo"
      : native
        ? "FFmpeg no detectado"
        : "Vista previa";

  if (collapsed) {
    return (
      <div className="mb-2 grid h-8 place-items-center" title={title}>
        <StatusDot
          status={status === "success" ? "success" : status === "warning" ? "warning" : "idle"}
          pulse={loading}
        />
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-card border border-border bg-surface-2/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <StatusDot
          status={status === "success" ? "success" : status === "warning" ? "warning" : "idle"}
          pulse={loading}
        />
        <span className="truncate text-[11px] font-medium text-text">{title}</span>
      </div>
      <p className="mt-1 truncate font-mono text-[10px] text-subtle">
        {loading && "detectando binarios"}
        {!loading && ready && (ffmpeg?.version ?? "ffmpeg")}
        {!loading && !ready && native && "revisa Ajustes → Motores"}
        {!loading && !ready && !native && "las conversiones son simuladas"}
      </p>
    </div>
  );
}
