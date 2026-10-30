import { QueuePanel } from "@/components/conversion/QueuePanel";
import { countJobs } from "@/lib/jobs";
import { useQueueStore } from "@/store/queue-store";

export function QueuePage() {
  const jobs = useQueueStore((state) => state.jobs);
  const counts = countJobs(jobs);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-5">
      <header className="flex flex-col gap-0.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
          Monitor
        </span>
        <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">
          Cola de conversión
        </h1>
        <p className="text-[12px] text-muted">
          {counts.active > 0
            ? `${counts.active} ${counts.active === 1 ? "trabajo activo" : "trabajos activos"} de ${counts.total}.`
            : jobs.length > 0
              ? `${counts.done} completadas de ${counts.total}.`
              : "Aquí verás el progreso de cada conversión."}
        </p>
      </header>

      <QueuePanel variant="page" />
    </div>
  );
}
