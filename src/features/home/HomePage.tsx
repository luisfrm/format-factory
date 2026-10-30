import { PagePlaceholder } from "@/components/PagePlaceholder";

export function HomePage() {
  return (
    <PagePlaceholder
      title="Inicio"
      description="El punto de entrada: arrastras un archivo y la app te sugiere a qué convertirlo."
      blocks={[
        "Zona de arrastre con estados idle / dragging",
        "Acciones rápidas: Video → MP4, Video → Audio, Audio → Audio",
        "Matriz de formatos con tabs Video / Audio",
        "Actividad reciente con estado y ahorro de tamaño",
        "Dock de cola activa sobre el borde inferior",
      ]}
    />
  );
}
