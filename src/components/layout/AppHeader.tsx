import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { sectionLabel } from "@/app/navigation";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useEngineStatus } from "@/features/engines/use-engine-status";
import { useConverterStore } from "@/store/converter-store";

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { loading, native, ffmpeg } = useEngineStatus();
  const pickFiles = useConverterStore((state) => state.pickFiles);

  const engineReady = ffmpeg?.available ?? false;

  async function handleAdd() {
    await pickFiles();
    if (pathname !== "/") navigate("/");
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-bg/80 px-5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2 text-[11px]">
        <span className="font-mono uppercase tracking-[0.14em] text-subtle">
          Format Factory
        </span>
        <span className="text-subtle/50">/</span>
        <span className="truncate font-medium text-text">
          {sectionLabel(pathname)}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div
          className="flex h-7 items-center gap-1.5 rounded-control border border-border bg-surface px-2"
          title={
            loading
              ? "Verificando motores"
              : engineReady
                ? (ffmpeg?.version ?? "FFmpeg")
                : native
                  ? "FFmpeg no detectado"
                  : "Vista previa del navegador"
          }
        >
          <StatusDot
            status={loading ? "idle" : engineReady ? "success" : native ? "warning" : "idle"}
            pulse={loading}
          />
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
            {loading ? "motor" : engineReady ? "ffmpeg" : native ? "sin motor" : "demo"}
          </span>
        </div>

        <Button size="sm" variant="primary" onClick={handleAdd}>
          <Plus size={14} strokeWidth={2.4} />
          Añadir archivos
        </Button>
      </div>
    </header>
  );
}
