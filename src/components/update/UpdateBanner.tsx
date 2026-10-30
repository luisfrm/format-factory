import { ArrowRight, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useUpdateStore } from "@/store/update-store";

type UpdateBannerProps = {
  onOpen: () => void;
};

export function UpdateBanner({ onOpen }: UpdateBannerProps) {
  const available = useUpdateStore((state) => state.available);
  const supported = useUpdateStore((state) => state.supported);
  const snooze = useUpdateStore((state) => state.snooze);

  if (!available) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b border-accent/20 bg-accent-soft/50 px-4 py-1.5">
        <Sparkles size={13} className="shrink-0 text-accent" />

        <p className="min-w-0 truncate text-[12px] text-text">
          <span className="font-medium">v{available.version}</span>{" "}
          <span className="text-muted">
            {supported ? "está disponible" : "disponible para descargar"}
          </span>
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="ml-auto flex items-center gap-1 rounded-control px-1.5 py-0.5 text-[11px] font-medium text-accent transition-colors duration-(--dur-fast) hover:bg-accent/10 hover:text-accent-bright"
        >
          {supported ? "Actualizar" : "Ver"}
          <ArrowRight size={12} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={snooze}
          aria-label="Recordar en una semana"
          title="Recordar en una semana"
          className="grid size-6 place-items-center rounded-control text-subtle transition-colors duration-(--dur-fast) hover:bg-surface-2 hover:text-text"
        >
          <X size={13} />
        </button>
      </div>
    </motion.div>
  );
}
