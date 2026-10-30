import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "motion/react";
import { NAV_ITEMS, SECONDARY_NAV, type NavItem } from "@/app/navigation";
import { EngineStatusCard } from "@/components/layout/EngineStatusCard";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { useQueueStore } from "@/store/queue-store";

const EXPANDED = 240;
const RAIL = 64;

function NavEntry({
  item,
  collapsed,
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex h-9 items-center gap-2.5 rounded-control px-2.5 text-[13px]",
          "transition-colors duration-(--dur-fast) ease-standard",
          isActive
            ? "bg-surface-2 font-medium text-text"
            : "text-muted hover:bg-surface-2/70 hover:text-text",
          collapsed && "justify-center px-0",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity duration-(--dur-base)",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon
            size={17}
            strokeWidth={1.8}
            className={cn(
              "shrink-0 transition-colors",
              isActive ? "text-accent" : "text-current",
            )}
          />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
              {badge}
            </span>
          )}
          {collapsed && badge !== undefined && badge > 0 && (
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const activeJobs = useQueueStore((state) =>
    state.jobs.reduce(
      (total, job) =>
        total + (job.status === "running" || job.status === "queued" ? 1 : 0),
      0,
    ),
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? RAIL : EXPANDED }}
      initial={false}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-surface"
    >
      <div className={cn("flex h-12 shrink-0 items-center gap-2.5 px-3", collapsed && "justify-center px-0")}>
        <div className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-accent text-[11px] font-bold tracking-tight text-white shadow-[0_0_18px_var(--color-accent-soft)]">
          FF
        </div>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[12px] font-semibold leading-none">
              Format Factory
            </p>
            <span className="rounded-xs bg-surface-2 px-1 py-0.5 font-mono text-[9px] font-bold text-subtle">
              v0.1
            </span>
          </div>
        )}
      </div>

      <div className={cn("px-3 pb-1 pt-3", collapsed && "px-2")}>
        {!collapsed && (
          <p className="px-1 pb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Espacio de trabajo
          </p>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-0.5 px-2", collapsed && "px-2")}>
        {NAV_ITEMS.map((item) => (
          <NavEntry
            key={item.to}
            item={item}
            collapsed={collapsed}
            badge={item.badgeKey === "queue" ? activeJobs : undefined}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <EngineStatusCard collapsed={collapsed} />

        {SECONDARY_NAV.map((item) => (
          <NavEntry key={item.to} item={item} collapsed={collapsed} />
        ))}

        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className={cn(
            "flex h-8 items-center gap-2.5 rounded-control px-2.5 text-[12px] text-subtle",
            "transition-colors duration-(--dur-fast) hover:bg-surface-2 hover:text-text",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose size={16} strokeWidth={1.8} />
              <span>Contraer</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
