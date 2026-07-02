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
}
