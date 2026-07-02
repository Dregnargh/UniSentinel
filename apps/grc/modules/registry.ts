// The module registry: every module the platform knows about, licensed or
// not. Pure data (client-import-safe). Adding a module = add its manifest
// here; the drawer, permission catalog, entity-type registry and event
// registry all derive from this list.
import type { ModuleManifest, ReportDef, WidgetDef } from "./types";
import { catalogManifest } from "./catalog/manifest";
import { tasksManifest } from "./tasks/manifest";
import { riskManifest } from "./risk/manifest";

export const MODULES: ModuleManifest[] = [catalogManifest, tasksManifest, riskManifest];

const byKey = new Map(MODULES.map((m) => [m.key, m]));

export function getModule(key: string): ModuleManifest | null {
  return byKey.get(key) ?? null;
}

export function allEntityTypes(): Set<string> {
  return new Set(MODULES.flatMap((m) => m.entityTypes));
}

export function allEventTypes(): Set<string> {
  return new Set(MODULES.flatMap((m) => m.emits));
}

export interface RegisteredWidget extends WidgetDef {
  moduleKey: string;
  moduleName: string;
}

export function allWidgets(): RegisteredWidget[] {
  return MODULES.flatMap((m) =>
    (m.widgets ?? []).map((w) => ({ ...w, moduleKey: m.key, moduleName: m.name })),
  );
}

export function findWidget(key: string): RegisteredWidget | null {
  return allWidgets().find((w) => w.key === key) ?? null;
}

export interface RegisteredReport extends ReportDef {
  moduleKey: string;
  moduleName: string;
}

export function allReports(): RegisteredReport[] {
  return MODULES.flatMap((m) =>
    (m.reports ?? []).map((r) => ({ ...r, moduleKey: m.key, moduleName: m.name })),
  );
}

export function findReport(key: string): RegisteredReport | null {
  return allReports().find((r) => r.key === key) ?? null;
}
