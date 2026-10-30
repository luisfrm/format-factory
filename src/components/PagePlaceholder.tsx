import { Construction } from "lucide-react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  /** Pieces that will live on this page. Keeps the roadmap visible in-app. */
  blocks: string[];
};

export function PagePlaceholder({
  title,
  description,
  blocks,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
        <Construction size={13} strokeWidth={2.2} />
        Pendiente de diseño
      </div>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {description}
      </p>

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {blocks.map((block) => (
          <li
            key={block}
            className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-muted"
          >
            <span className="mr-2 text-accent">•</span>
            {block}
          </li>
        ))}
      </ul>
    </div>
  );
}
