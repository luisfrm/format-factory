import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, Download, ExternalLink, RotateCw } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { useQueueStore } from "@/store/queue-store";
import { useUpdateStore } from "@/store/update-store";

const RELEASES_URL = "https://github.com/luisfrm/format-factory/releases/latest";

type UpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateDialog({ open, onOpenChange }: UpdateDialogProps) {
  const available = useUpdateStore((state) => state.available);
  const currentVersion = useUpdateStore((state) => state.currentVersion);
  const supported = useUpdateStore((state) => state.supported);
  const status = useUpdateStore((state) => state.status);
  const progress = useUpdateStore((state) => state.progress);
  const error = useUpdateStore((state) => state.error);

  const install = useUpdateStore((state) => state.install);
  const snooze = useUpdateStore((state) => state.snooze);
  const skip = useUpdateStore((state) => state.skip);

  const activeJobs = useQueueStore(
    (state) =>
      state.jobs.filter(
        (job) => job.status === "running" || job.status === "queued",
      ).length,
  );

  if (!available) return null;

  const downloading = status === "downloading";
  const ready = status === "ready";
  const blocked = supported && activeJobs > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-bg/70 backdrop-blur-[2px]",
            "data-[state=open]:animate-[ff-overlay-in_180ms_ease-out]",
            "data-[state=closed]:animate-[ff-overlay-out_140ms_ease-in]",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-panel border border-border-strong bg-surface p-5",
            "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]",
            "data-[state=open]:animate-[ff-dialog-in_200ms_cubic-bezier(0.2,0,0,1)]",
            "data-[state=closed]:animate-[ff-dialog-out_150ms_cubic-bezier(0.4,0,1,1)]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight text-text">
                Actualizar a v{available.version}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-[12px] text-muted">
                {currentVersion ? `Tienes la v${currentVersion}.` : "Nueva versión disponible."}{" "}
                Tus conversiones y ajustes se conservan.
              </DialogPrimitive.Description>
            </div>
            <Badge tone="accent">{available.version}</Badge>
          </div>

          {available.notes && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-card border border-border bg-bg/50 p-3">
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted">
                {available.notes}
              </p>
            </div>
          )}

          {!supported && (
            <div className="mt-3 flex items-start gap-2 rounded-card border border-warning/25 bg-warning/5 p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-[11px] leading-relaxed text-muted">
                Esta instalación no admite actualización automática. Descarga el
                instalador y ábrelo encima de la versión actual: no se pierde nada.
              </p>
            </div>
          )}

          {blocked && (
            <div className="mt-3 flex items-start gap-2 rounded-card border border-accent/25 bg-accent-soft/40 p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[11px] leading-relaxed text-muted">
                Hay {activeJobs} {activeJobs === 1 ? "conversión activa" : "conversiones activas"}.
                Termínalas o cancélalas antes de actualizar para no perder el trabajo.
              </p>
            </div>
          )}

          {downloading && (
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[10px] text-subtle">
                <span>Descargando…</span>
                <span className="text-accent">
                  {progress.percent !== null ? `${Math.round(progress.percent)}%` : "…"}
                </span>
              </div>
              <Progress value={progress.percent ?? 0} status="active" size="md" />
            </div>
          )}

          {ready && (
            <div className="mt-3 flex items-center gap-2 rounded-card border border-success/25 bg-success/5 p-3">
              <RotateCw size={14} className="animate-spin text-success" />
              <p className="text-[11px] text-muted">
                Instalada. Reiniciando la app…
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-card border border-danger/25 bg-danger/5 p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-[11px] leading-relaxed text-muted">{error}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {!supported ? (
              <>
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="sm">
                    Cerrar
                  </Button>
                </DialogPrimitive.Close>
                <Button
                  size="sm"
                  onClick={() => {
                    void openUrl(RELEASES_URL);
                    snooze();
                  }}
                >
                  <ExternalLink size={13} />
                  Abrir descargas
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={skip} disabled={downloading || ready}>
                  Omitir esta versión
                </Button>
                <Button variant="ghost" size="sm" onClick={snooze} disabled={downloading || ready}>
                  Ahora no
                </Button>
                <Button
                  size="sm"
                  onClick={() => void install()}
                  disabled={downloading || ready || blocked}
                >
                  <Download size={13} />
                  {downloading ? "Descargando…" : "Actualizar ahora"}
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
