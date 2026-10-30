import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV, type NavItem } from "@/app/navigation";
import { EngineStatusCard } from "@/components/layout/EngineStatusCard";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

function NavEntry({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium",
          "text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text",
          isActive && "bg-surface-2 text-text",
          collapsed && "justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent opacity-0 transition-opacity",
              isActive && "opacity-100",
            )}
          />
          <Icon
            size={18}
            strokeWidth={1.9}
            className={cn(
              "shrink-0 transition-colors",
              isActive ? "text-accent" : "text-current",
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-surface",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center gap-3 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent text-sm font-bold tracking-tight text-white shadow-[0_0_20px_var(--color-accent-soft)]">
          FF
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Format Factory
            </p>
            <p className="truncate text-[11px] leading-tight text-muted">
              Conversor de archivos
            </p>
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavEntry key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 px-3 pb-3">
        <EngineStatusCard collapsed={collapsed} />

        {SECONDARY_NAV.map((item) => (
          <NavEntry key={item.to} item={item} collapsed={collapsed} />
        ))}

        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          aria-label={
            collapsed ? "Expandir barra lateral" : "Contraer barra lateral"
          }
          className={cn(
            "mt-1 flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium",
            "text-muted transition-colors hover:bg-surface-2 hover:text-text",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.9} />
          ) : (
            <>
              <PanelLeftClose size={18} strokeWidth={1.9} />
              <span>Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
