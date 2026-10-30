import { CloudUpload, FolderOpen, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isTauri } from "@/lib/backend";
import { cn } from "@/lib/cn";
import { useConverterStore } from "@/store/converter-store";

const HIGHLIGHTS = ["MKV", "MP4", "MOV", "WEBM", "MP3", "M4A", "FLAC", "WAV"];

type DropZoneProps = {
  compact?: boolean;
};

export function DropZone({ compact = false }: DropZoneProps) {
  const pickFiles = useConverterStore((state) => state.pickFiles);
  const addPaths = useConverterStore((state) => state.addPaths);
  const [dragging, setDragging] = useState(false);
  const addPathsRef = useRef(addPaths);
  addPathsRef.current = addPaths;

  // Native OS drag & drop (Tauri gives us real paths, the DOM does not).
  useEffect(() => {
    if (!isTauri) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;

    void import("@tauri-apps/api/webview").then(({ getCurrentWebview }) => {
      void getCurrentWebview()
        .onDragDropEvent((event) => {
          const payload = event.payload;
          if (payload.type === "enter" || payload.type === "over") {
            setDragging(true);
          } else if (payload.type === "drop") {
            setDragging(false);
            void addPathsRef.current(payload.paths);
          } else {
            setDragging(false);
          }
        })
        .then((unlisten) => {
          if (cancelled) unlisten();
          else dispose = unlisten;
        });
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) return;

    // In the browser we only have File objects, so the file name is the path.
    void addPathsRef.current(files.map((file) => file.name));
  }

  const dragProps = isTauri
    ? {}
    : {
        onDragOver: (event: React.DragEvent) => {
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: handleDrop,
      };

  if (compact) {
    return (
      <div
        {...dragProps}
        className={cn(
          "flex items-center justify-between gap-3 rounded-card border border-dashed px-3 py-2",
          "transition-all duration-(--dur-base) ease-standard",
          dragging
            ? "border-accent bg-accent-soft/40"
            : "border-border bg-surface/40 hover:border-border-strong",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <CloudUpload size={14} className={dragging ? "text-accent" : "text-subtle"} />
          <span>
            {dragging ? "Suelta para añadir" : "Arrastra más archivos aquí"}
          </span>
        </div>
        <Button size="xs" variant="ghost" onClick={() => void pickFiles()}>
          <Plus size={12} />
          Añadir
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      {...dragProps}
      layout
      className={cn(
        "tech-grid relative overflow-hidden rounded-panel border border-dashed px-6 py-10 text-center",
        "transition-[border-color,background-color,box-shadow] duration-(--dur-base) ease-standard",
        dragging
          ? "border-accent bg-accent-soft/30 shadow-[0_0_40px_-12px_var(--color-accent)]"
          : "border-border-strong bg-surface/50 hover:border-border-strong hover:bg-surface/70",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-(--dur-slow)",
          dragging ? "bg-accent/25 opacity-100" : "bg-accent/10 opacity-70",
        )}
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={dragging ? { y: -3, scale: 1.04 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
          className="relative grid size-14 place-items-center rounded-panel border border-border-strong bg-surface-2 text-accent"
        >
          <CloudUpload size={26} strokeWidth={1.6} />
        </motion.div>

        <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-text">
          {dragging ? "Suelta para convertir" : "Arrastra tus archivos aquí"}
        </h2>
        <p className="mt-1 max-w-md text-[12px] leading-relaxed text-muted">
          Detectamos el formato automáticamente. Puedes soltar varios a la vez para
          convertir un lote completo.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onClick={() => void pickFiles()}>
            <FolderOpen size={14} strokeWidth={2.2} />
            Seleccionar archivos
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-subtle">
            Entradas
          </span>
          {HIGHLIGHTS.map((format) => (
            <Badge key={format} tone="outline" className="font-normal">
              {format}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
