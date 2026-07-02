// Catalog widget data (server-only). Dispatched by platform/dashboards/data.ts
// AFTER the module-license and viewer-permission checks have passed.
import type { WidgetData } from "@/modules/types";
import { catalogStats } from "./queries";

export async function catalogWidgetData(widgetKey: string, workspaceId: string): Promise<WidgetData | null> {
  if (widgetKey === "catalog.inventory") {
    const stats = await catalogStats(workspaceId);
    return {
      kind: "stats",
      stats: [
        { label: "Services", value: String(stats.services), tone: "brand" },
        { label: "Assets", value: String(stats.assets), tone: "info" },
        { label: "Relationships", value: String(stats.relationships), tone: "neutral" },
        { label: "Data flows", value: String(stats.dataFlows), tone: "neutral" },
      ],
    };
  }
  return null;
}
