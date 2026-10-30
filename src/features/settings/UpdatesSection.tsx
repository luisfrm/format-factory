import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/features/settings/Section";
import { Badge } from "@/components/ui/badge";
import { useUpdateStore } from "@/store/update-store";

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "nunca";
  return new Date(timestamp).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpdatesSection() {
  const currentVersion = useUpdateStore((state) => state.currentVersion);
  const supported = useUpdateStore((state) => state.supported);
  const installKind = useUpdateStore((state) => state.installKind);
  const status = useUpdateStore((state) => state.status);
  const available = useUpdateStore((state) => state.available);
  const lastCheckedAt = useUpdateStore((state) => state.lastCheckedAt);
  const error = useUpdateStore((state) => state.error);
  const check = useUpdateStore((state) => state.check);
  const openDialog = useUpdateStore((state) => state.openDialog);

  const checking = status === "checking";
  const upToDate = !available && lastCheckedAt !== null && status !== "error";

  async function handleCheck() {
    const result = await check();

    if (result === "up-to-date") {
      toast.success("Estás al día", {
        description: `v${currentVersion ?? "—"} es la última versión disponible.`,
      });
    }

    if (result === "error") {
      toast.error("No se pudo comprobar", {
        description: useUpdateStore.getState().error ?? undefined,
      });
    }
  }

  return (
    <Section
      icon={RefreshCw}
      title="Actualizaciones"
      description="La app comprueba una vez al día si hay una versión nueva."
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-[11px] text-text">
            v{currentVersion ?? "—"}
            {installKind && installKind !== "unknown" && (
              <span className="ml-2 text-subtle">· {installKind}</span>
            )}
          </span>
          <span className="font-mono text-[10px] text-subtle">
            Última comprobación: {formatDate(lastCheckedAt)}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {available && (
            <Badge tone="accent">v{available.version} disponible</Badge>
          )}

          {upToDate && (
            <Badge tone="success">
              <Check size={10} strokeWidth={3} />
              Al día
            </Badge>
          )}

          {status === "error" && error && (
            <span className="max-w-[220px] truncate font-mono text-[10px] text-danger">
              {error}
            </span>
          )}

          {available ? (
            <Button size="sm" onClick={openDialog}>
              Actualizar a v{available.version}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleCheck()}
              disabled={checking}
            >
              <RefreshCw size={13} className={checking ? "animate-spin" : undefined} />
              {checking ? "Comprobando…" : "Buscar actualizaciones"}
            </Button>
          )}
        </div>
      </div>

      {!supported && (
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-subtle">
          Esta instalación ({installKind ?? "desconocida"}) no admite actualización
          automática. Te avisaremos igualmente con el enlace de descarga.
        </p>
      )}
    </Section>
  );
}
