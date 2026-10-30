import { PagePlaceholder } from "@/components/PagePlaceholder";

export function ConvertPage() {
  return (
    <PagePlaceholder
      title="Convertir"
      description="Flujo guiado de un solo archivo: origen, destino, ajustes y conversión."
      blocks={[
        "Selección de archivo o arrastre directo",
        "Metadatos del archivo vía ffprobe",
        "Selector de formato destino filtrado por compatibilidad",
        "Presets: calidad, resolución, bitrate",
        "Vista previa del comando y estimación de tamaño",
      ]}
    />
  );
}
