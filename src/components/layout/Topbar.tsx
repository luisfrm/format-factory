import { useLocation } from "react-router-dom";
import { Search, Zap } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV } from "@/app/navigation";

function useCurrentTitle() {
  const { pathname } = useLocation();
  const match = [...NAV_ITEMS, ...SECONDARY_NAV].find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "Format Factory";
}

export function Topbar() {
  const title = useCurrentTitle();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs text-muted transition-colors hover:border-border-strong hover:text-text md:flex"
        >
          <Search size={14} strokeWidth={2} />
          <span>Buscar</span>
          <kbd className="ml-6 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
            Ctrl K
          </kbd>
        </button>

        <div className="flex h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs text-muted">
          <Zap size={13} className="text-accent" strokeWidth={2.2} />
          <span>Sin trabajos</span>
        </div>
      </div>
    </header>
  );
}
