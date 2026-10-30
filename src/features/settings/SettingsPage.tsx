import { Check, Cpu, FolderOpen, HardDrive, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusDot } from "@/components/ui/status-dot";
import { useEngineStatus } from "@/features/engines/use-engine-status";
import { Section } from "@/features/settings/Section";
import { UpdatesSection } from "@/features/settings/UpdatesSection";
import { QUALITY_PRESETS, type QualityPreset } from "@/lib/formats";
import { useConverterStore } from "@/store/converter-store";

export function SettingsPage() {
  const { engines, loading, native } = useEngineStatus();
  const quality = useConverterStore((state) => state.quality);
  const setQuality = useConverterStore((state) => state.setQuality);
  const outputDirectory = useConverterStore((state) => state.outputDirectory);
  const setOutputDirectory = useConverterStore((state) => state.setOutputDirectory);
  const pickOutputDirectory = useConverterStore((state) => state.pickOutputDirectory);

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-3 px-5 py-5">
      <header className="flex flex-col gap-0.5 pb-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
          Preferencias
        </span>
        <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">
          Ajustes
        </h1>
        <p className="text-[12px] text-muted">
          Motores de conversión, destino de archivos y comportamiento por defecto.
        </p>
      </header>

      <Section
        icon={Cpu}
        title="Motores"
        description="Binarios externos que ejecutan las conversiones."
      >
        <ul className="flex flex-col gap-1.5">
          {loading && (
            <li className="font-mono text-[11px] text-subtle">Detectando motores…</li>
          )}
          {!loading && engines.length === 0 && (
            <li className="font-mono text-[11px] text-subtle">
              No se pudo consultar el backend (modo navegador).
            </li>
          )}
          {engines.map((engine) => (
            <li
              key={engine.id}
              className="flex items-center gap-2.5 rounded-control border border-border bg-bg/40 px-2.5 py-2"
            >
              <StatusDot status={engine.available ? "success" : native ? "warning" : "idle"} />
              <span className="text-[12px] font-medium text-text">{engine.label}</span>
              <Badge
                tone={engine.available ? "success" : "warning"}
                className="ml-auto"
              >
                {engine.available ? "listo" : native ? "no encontrado" : "demo"}
              </Badge>
              {engine.version && (
                <span className="hidden max-w-[260px] truncate font-mono text-[10px] text-subtle lg:block">
                  {engine.version}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        icon={HardDrive}
        title="Carpeta de salida"
        description="Por defecto cada archivo se guarda junto al original."
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-control border border-border bg-bg/60 px-2.5">
            <FolderOpen size={13} className="shrink-0 text-subtle" />
            <span className="truncate font-mono text-[11px] text-muted">
              {outputDirectory ?? "Misma carpeta que el archivo original"}
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void pickOutputDirectory()}>
            Elegir
          </Button>
          {outputDirectory && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOutputDirectory(null)}
              aria-label="Restablecer carpeta de salida"
            >
              <X size={13} />
            </Button>
          )}
        </div>
      </Section>

      <Section
        icon={Check}
        title="Calidad por defecto"
        description="Se aplica a las nuevas conversiones; puedes cambiarla en la pantalla principal."
      >
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<QualityPreset>
            value={quality}
            options={QUALITY_PRESETS.map((preset) => ({
              value: preset.id,
              label: preset.label,
            }))}
            onChange={setQuality}
            ariaLabel="Calidad por defecto"
            size="md"
          />
          <span className="font-mono text-[10px] text-subtle">
            {QUALITY_PRESETS.find((preset) => preset.id === quality)?.hint}
          </span>
        </div>
      </Section>

      <UpdatesSection />

      <Section
        icon={Info}
        title="Acerca de"
        description="Tauri 2 · React 19 · FFmpeg."
      >        <p className="font-mono text-[10px] leading-relaxed text-subtle">
          Las conversiones se ejecutan en local: ningún archivo sale de este equipo.
          {!native && " Ahora mismo estás en la vista previa del navegador, donde las conversiones son simuladas."}
        </p>
      </Section>
    </div>
  );
}
