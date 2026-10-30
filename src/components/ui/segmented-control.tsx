import { motion } from "motion/react";
import { useId, useRef } from "react";
import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Radio group with a shared-layout thumb. Implements the WAI-ARIA radiogroup
 * pattern: only the selected option is tabbable, arrows move the selection.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  size = "sm",
}: SegmentedControlProps<T>) {
  const layoutId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function moveSelection(from: number, direction: 1 | -1) {
    const nextIndex = (from + direction + options.length) % options.length;
    onChange(options[nextIndex].value);
    buttons.current[nextIndex]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control bg-surface-3/60 p-0.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveSelection(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveSelection(index, -1);
              }
            }}
            className={cn(
              "relative rounded-[4px] font-medium transition-colors duration-(--dur-base) ease-standard",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]",
              selected ? "text-text" : "text-muted hover:text-text",
            )}
          >
            {selected && (
              <motion.span
                layoutId={`segmented-${layoutId}`}
                className="absolute inset-0 rounded-[4px] bg-surface-2 shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
