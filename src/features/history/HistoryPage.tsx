import { PagePlaceholder } from "@/components/PagePlaceholder";

export function HistoryPage() {
  return (
    <PagePlaceholder
      title="Historial"
      description="Registro persistente de conversiones, guardado en SQLite local."
      blocks={[
        "Tabla con búsqueda y filtros por tipo y estado",
        "Abrir archivo de salida o su carpeta",
        "Reconvertir con los mismos ajustes",
        "Estadísticas: espacio ahorrado, tiempo total",
        "Limpieza de registros antiguos",
      ]}
    />
  );
}
