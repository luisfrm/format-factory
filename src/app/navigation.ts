import { ArrowLeftRight, History, ListOrdered, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Optional key for badges driven by live app state. */
  badgeKey?: "queue";
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Convertir", icon: ArrowLeftRight },
  { to: "/queue", label: "Cola", icon: ListOrdered, badgeKey: "queue" },
  { to: "/history", label: "Historial", icon: History },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: "/settings", label: "Ajustes", icon: Settings },
];

export function sectionLabel(pathname: string): string {
  const match = [...NAV_ITEMS, ...SECONDARY_NAV].find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "Format Factory";
}
