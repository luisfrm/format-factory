import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
};

export function Section({ icon: Icon, title, description, children }: SectionProps) {
  return (
    <section className="rounded-panel border border-border bg-surface/40 p-4">
      <header className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-control border border-border bg-surface-2 text-muted">
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[12px] font-semibold text-text">{title}</h2>
          <p className="text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
      </header>
      <div className="mt-3 border-t border-border pt-3">{children}</div>
    </section>
  );
}
