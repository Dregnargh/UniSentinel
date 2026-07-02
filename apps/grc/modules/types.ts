// Module manifest contract. Manifests are PURE DATA (client-import-safe): no
// functions, no server imports — icons are string keys resolved by the shell.
// Server-side wiring (event handlers, jobs) lives in modules/<key>/server.ts,
// aggregated separately.
import type { PermissionGroup } from "@/platform/rbac/catalog";

export interface ModuleManifest {
  key: string;
  name: string;
  /** Short pitch shown in the app drawer and on the module home. */
  description: string;
  /** Icon key resolved by components/shell/moduleIcons.tsx. */
  icon: string;
  /** Contributed to the RBAC permission catalog (visible even when unlicensed
   *  so roles can be prepared ahead of purchase). */
  permissions: PermissionGroup;
  /** Entity types this module owns, as "<module>:<entity>". */
  entityTypes: string[];
  /** Domain event types this module emits. */
  emits: string[];
  /** Which roadmap phase delivers the module's real screens. */
  plannedPhase: number;
  /** Module sub-navigation shown in the sidebar while inside /m/<key>.
   *  Paths are relative to the module root ("" = module home). */
  navigation?: { path: string; label: string }[];
  /** Dashboard widgets this module contributes (metadata only — the data
   *  function lives in modules/<key>/widgets.ts, dispatched server-side). */
  widgets?: WidgetDef[];
  /** Report types this module contributes (metadata only — the data function
   *  lives in modules/<key>/reports.ts, dispatched server-side). */
  reports?: ReportDef[];
}

export interface WidgetDef {
  /** "<module>.<name>", unique platform-wide. */
  key: string;
  title: string;
  description: string;
  /** Columns spanned on the 3-column dashboard grid. */
  span: 1 | 2 | 3;
  /** Permission required to see the widget — enforced again server-side when
   *  the data is fetched, so a stale layout never leaks. */
  permission: string;
}

export interface ReportParamDef {
  name: string;
  label: string;
  /** v1 report params are static selects — options are manifest constants.
   *  The first option is the default. Runtime-sourced options (org units,
   *  owners) arrive with report templates. */
  options: { value: string; label: string }[];
}

export interface ReportDef {
  /** "<module>.<name>", unique platform-wide. */
  key: string;
  title: string;
  description: string;
  /** Permission required to list and generate the report. */
  permission: string;
  params: ReportParamDef[];
}

// ---------------------------------------------------------------------------
// Widget data contract: every widget resolves (server-side, under the
// VIEWER's permissions) to one of these serializable shapes, and one generic
// client renderer paints them. Adding a widget never means a new client
// component.
// ---------------------------------------------------------------------------

export type WidgetTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export type WidgetData =
  | { kind: "stats"; stats: { label: string; value: string; tone?: WidgetTone }[] }
  | {
      kind: "list";
      items: { title: string; meta?: string; href?: string; badge?: string; badgeTone?: WidgetTone }[];
      empty: string;
    }
  | {
      kind: "table";
      columns: string[];
      rows: { cells: string[]; href?: string }[];
      empty: string;
    }
  | {
      kind: "heatmap";
      /** cells[likelihood-1][impact-1] — counts with a band tone per cell. */
      cells: { count: number; band: string }[][];
    };
