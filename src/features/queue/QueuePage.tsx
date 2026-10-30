import { PagePlaceholder } from "@/components/PagePlaceholder";

export function QueuePage() {
  return (
    <PagePlaceholder
      title="Cola"
      description="Todos los trabajos en curso y en espera, con control de concurrencia."
      blocks={[
        "Lista de trabajos con progreso en tiempo real",
        "Pausar, reanudar y cancelar",
        "Reordenar prioridad",
        "Límite de conversiones simultáneas",
        "Consola con el log de ffmpeg de cada trabajo",
      ]}
    />
  );
}
