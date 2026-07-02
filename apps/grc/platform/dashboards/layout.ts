// Pure dashboard-layout operations (client-import-safe, unit-tested).
// v1 rule: a widget appears at most once per dashboard, so the instance id IS
// the widget key. The stored jsonb shape keeps a separate id field so later
// versions can relax this without a data migration.
import type { DashboardWidgetInstance } from "@unisentinel/db";

/** Curated default order — filtered to what the viewer can actually see. */
const DEFAULT_ORDER = ["risk.bands", "risk.heatmap", "tasks.status", "tasks.my", "catalog.inventory", "risk.top"];

export function defaultLayout(availableKeys: string[]): DashboardWidgetInstance[] {
  const available = new Set(availableKeys);
  const curated = DEFAULT_ORDER.filter((key) => available.has(key));
  const rest = availableKeys.filter((key) => !DEFAULT_ORDER.includes(key));
  return [...curated, ...rest].map((key) => ({ id: key, widgetKey: key }));
}

export function addInstance(layout: DashboardWidgetInstance[], widgetKey: string): DashboardWidgetInstance[] {
  if (layout.some((i) => i.widgetKey === widgetKey)) return layout;
  return [...layout, { id: widgetKey, widgetKey }];
}

export function removeInstance(layout: DashboardWidgetInstance[], id: string): DashboardWidgetInstance[] {
  return layout.filter((i) => i.id !== id);
}

export function moveInstance(
  layout: DashboardWidgetInstance[],
  id: string,
  direction: -1 | 1,
): DashboardWidgetInstance[] {
  const from = layout.findIndex((i) => i.id === id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= layout.length) return layout;
  const next = [...layout];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Drop entries whose widget no longer exists (module removed/renamed). */
export function sanitizeLayout(
  layout: DashboardWidgetInstance[],
  knownKeys: Set<string>,
): DashboardWidgetInstance[] {
  return layout.filter((i) => knownKeys.has(i.widgetKey));
}
