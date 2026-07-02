// Dashboard resolution (server-only): effective layout → widget data, fetched
// under the VIEWER's permissions. This is the platform-side dispatcher — the
// one place allowed to call each module's widget-data provider (mirrors
// modules/wiring.ts for events).
import type { WidgetData } from "@/modules/types";
import { allWidgets, type RegisteredWidget } from "@/modules/registry";
import { catalogWidgetData } from "@/modules/catalog/widgets";
import { tasksWidgetData } from "@/modules/tasks/widgets";
import { riskWidgetData } from "@/modules/risk/widgets";
import { getEntitlements } from "@/platform/modules/entitlements";
import { permitted } from "@/platform/rbac/catalog";
import { createLogger } from "@/platform/log";
import { defaultLayout, sanitizeLayout } from "./layout";
import { getSavedLayout } from "./store";

const log = createLogger("dashboards");

export interface ResolvedWidget {
  id: string;
  widgetKey: string;
  title: string;
  span: 1 | 2 | 3;
  data: WidgetData;
}

/** Widgets the viewer may add: module licensed AND permission held. */
export async function availableWidgets(
  workspaceId: string,
  permissions: Set<string>,
): Promise<RegisteredWidget[]> {
  const entitlements = await getEntitlements(workspaceId);
  return allWidgets().filter(
    (w) => entitlements.get(w.moduleKey)?.status === "active" && permitted(permissions, w.permission),
  );
}

function widgetData(
  def: RegisteredWidget,
  workspaceId: string,
  viewerUserId: string,
): Promise<WidgetData | null> {
  switch (def.moduleKey) {
    case "risk":
      return riskWidgetData(def.key, workspaceId);
    case "tasks":
      return tasksWidgetData(def.key, workspaceId, viewerUserId);
    case "catalog":
      return catalogWidgetData(def.key, workspaceId);
    default:
      return Promise.resolve(null);
  }
}

/**
 * The viewer's home dashboard, fully resolved. Instances whose module is
 * unlicensed or whose permission the viewer lacks are hidden, not errored —
 * a stale layout never leaks and never breaks.
 */
export async function resolveDashboard(
  workspaceId: string,
  viewerUserId: string,
  permissions: Set<string>,
): Promise<{ widgets: ResolvedWidget[]; customized: boolean }> {
  const [saved, available] = await Promise.all([
    getSavedLayout(workspaceId, viewerUserId),
    availableWidgets(workspaceId, permissions),
  ]);
  const availByKey = new Map(available.map((w) => [w.key, w]));
  const layout = saved
    ? sanitizeLayout(saved, new Set(allWidgets().map((w) => w.key)))
    : defaultLayout(available.map((w) => w.key));

  const widgets = await Promise.all(
    layout
      .filter((i) => availByKey.has(i.widgetKey))
      .map(async (i) => {
        const def = availByKey.get(i.widgetKey)!;
        try {
          const data = await widgetData(def, workspaceId, viewerUserId);
          return data ? { id: i.id, widgetKey: i.widgetKey, title: def.title, span: def.span, data } : null;
        } catch (err) {
          // One broken widget never takes the dashboard down.
          log.error("widget data failed", { widget: i.widgetKey, error: String(err) });
          return null;
        }
      }),
  );
  return { widgets: widgets.filter((w): w is ResolvedWidget => w !== null), customized: saved !== null };
}
