import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  FORMATS,
  availableTargets,
  type MediaKind,
  type TargetFormat,
} from "@/lib/formats";

type TargetPickerProps = {
  value: TargetFormat;
  source: MediaKind;
  /** Preset lock: only offer this output family. */
  outputKind?: MediaKind | null;
  onChange: (target: TargetFormat) => void;
  size?: "sm" | "md";
  align?: "start" | "end";
  disabled?: boolean;
  label?: string;
};

const MENU_ITEM = [
  "relative flex cursor-pointer select-none items-center gap-2 rounded-[4px] px-2 py-1.5",
  "text-[12px] text-muted outline-none",
  "data-[highlighted]:bg-surface-3 data-[highlighted]:text-text",
].join(" ");

export function TargetPicker({
  value,
  source,
  outputKind,
  onChange,
  size = "sm",
  align = "end",
  disabled,
  label = "Formato de salida",
}: TargetPickerProps) {
  const locked = availableTargets(source, outputKind);
  // A probe can turn a "video" file into audio-only: fall back to every target
  // the source supports instead of showing an empty menu.
  const targets = locked.length > 0 ? locked : availableTargets(source);
  const videoTargets = targets.filter((target) => FORMATS[target].kind === "video");
  const audioTargets = targets.filter((target) => FORMATS[target].kind === "audio");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-control border border-border bg-surface-2/70 px-2",
            "font-mono text-[11px] font-semibold uppercase tracking-wide text-text",
            "transition-[background-color,border-color] duration-(--dur-fast) ease-standard",
            "hover:border-border-strong hover:bg-surface-3",
            "data-[state=open]:border-accent/50 data-[state=open]:bg-surface-3",
            "disabled:pointer-events-none disabled:opacity-40",
            size === "sm" ? "h-7" : "h-8",
          )}
        >
          {FORMATS[value].label}
          <ChevronDown
            size={12}
            strokeWidth={2.4}
            className="text-subtle transition-transform duration-(--dur-fast) group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            "z-50 w-60 rounded-card border border-border-strong bg-surface-2 p-1",
            "shadow-[0_16px_40px_-8px_rgba(0,0,0,0.65)]",
            "data-[state=open]:animate-[ff-menu-in_140ms_cubic-bezier(0.2,0,0,1)]",
          )}
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => onChange(next as TargetFormat)}
          >
            {videoTargets.length > 0 && (
              <DropdownMenu.Group>
                <DropdownMenu.Label className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-subtle">
                  Video
                </DropdownMenu.Label>
                {videoTargets.map((target) => (
                  <TargetItem key={target} target={target} selected={value === target} />
                ))}
              </DropdownMenu.Group>
            )}

            {audioTargets.length > 0 && (
              <DropdownMenu.Group>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Label className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-subtle">
                  Audio
                </DropdownMenu.Label>
                {audioTargets.map((target) => (
                  <TargetItem key={target} target={target} selected={value === target} />
                ))}
              </DropdownMenu.Group>
            )}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function TargetItem({
  target,
  selected,
}: {
  target: TargetFormat;
  selected: boolean;
}) {
  const spec = FORMATS[target];

  return (
    <DropdownMenu.RadioItem value={target} className={MENU_ITEM}>
      <span className="flex w-full flex-col gap-0.5 pr-4">
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-text">
            {spec.label}
          </span>
          {spec.recommended && (
            <span className="rounded-xs bg-accent-soft px-1 py-px font-mono text-[8px] font-bold uppercase text-accent">
              top
            </span>
          )}
        </span>
        <span className="text-[10px] leading-tight text-subtle">{spec.note}</span>
      </span>
      {selected && (
        <DropdownMenu.ItemIndicator className="absolute right-2">
          <Check size={13} className="text-accent" strokeWidth={2.6} />
        </DropdownMenu.ItemIndicator>
      )}
    </DropdownMenu.RadioItem>
  );
}
