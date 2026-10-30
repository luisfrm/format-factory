import { PagePlaceholder } from "@/components/PagePlaceholder";

export function SettingsPage() {
  return (
    <PagePlaceholder
      title="Ajustes"
      description="Configuración de motores, carpetas de salida y preferencias de la app."
      blocks={[
        "Detección de ffmpeg / ffprobe con ruta manual",
        "Carpeta de salida por defecto",
        "Concurrencia y prioridad de CPU",
        "Tema y preferencias de interfaz",
        "Acerca de y actualizaciones",
      ]}
    />
  );
}
