import { ArrowRight, AudioLines, Film, Gauge, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONVERSION_PRESETS, FORMATS, type ConversionPreset } from "@/lib/formats";
import { cn } from "@/lib/cn";
import { useConverterStore } from "@/store/converter-store";

const TONES = {
  accent: {
    icon: "text-accent bg-accent-soft border-accent/20",
    badge: "accent" as const,
    arrow: "group-hover:text-accent",
  },
  info: {
    icon: "text-info bg-info/10 border-info/20",
    badge: "info" as const,
    arrow: "group-hover:text-info",
  },
  success: {
    icon: "text-success bg-success/10 border-success/20",
    badge: "success" as const,
    arrow: "group-hover:text-success",
  },
  warning: {
    icon: "text-warning bg-warning/10 border-warning/20",
    badge: "warning" as const,
    arrow: "group-hover:text-warning",
  },
};

const ICONS = {
  video: Film,
  audio: Music,
  wave: AudioLines,
  compress: Gauge,
};

function PresetCard({ preset }: { preset: ConversionPreset }) {
  const pickFilesWithTarget = useConverterStore(
    (state) => state.pickFilesWithTarget,
  );
  const tone = TONES[preset.tone];
  const Icon = ICONS[preset.icon];
  const spec = FORMATS[preset.target];

  return (
    <button
      type="button"
      onClick={() => void pickFilesWithTarget(preset.target, preset.source)}
      className={cn(
        "group flex h-full flex-col justify-between gap-3 rounded-card border border-border bg-surface/60 p-3.5 text-left",
        "transition-[background-color,border-color,transform] duration-(--dur-base) ease-standard",
        "hover:-translate-y-px hover:border-border-strong hover:bg-surface-2",
        "focus-visible:-translate-y-px",
      )}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-control border",
                tone.icon,
              )}
            >
              <Icon size={17} strokeWidth={1.8} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[12px] font-semibold text-text">
                {preset.title}
              </span>
              <span className="truncate font-mono text-[10px] text-subtle">
                {preset.subtitle}
              </span>
            </span>
          </div>
          <Badge tone={tone.badge} className="mt-0.5 shrink-0">
            {preset.badge}
          </Badge>
        </div>

        <p className="text-[11px] leading-relaxed text-muted">
          {preset.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-subtle">
          <span>{preset.source === "video" ? "VIDEO" : "AUDIO"}</span>
          <span className="text-subtle/50">→</span>
          <span className="text-text/70">{spec.label}</span>
          <span className="text-subtle/50">•</span>
          <span>{spec.container}</span>
        </span>
        <ArrowRight
          size={14}
          className={cn(
            "text-subtle transition-[color,transform] duration-(--dur-base) ease-standard group-hover:translate-x-0.5",
            tone.arrow,
          )}
        />
      </div>
    </button>
  );
}

export function PresetGrid() {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="size-1.5 rounded-full bg-accent" />
        <h2 className="text-[12px] font-semibold tracking-tight text-text">
          Conversiones frecuentes
        </h2>
        <span className="ml-auto font-mono text-[10px] text-subtle">
          {CONVERSION_PRESETS.length} presets
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {CONVERSION_PRESETS.map((preset) => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </div>
    </section>
  );
}
