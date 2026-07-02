// Catalog report data (server-only). Dispatched by platform/reports/service.ts
// AFTER license/permission checks; params arrive validated against the
// manifest's option lists.
import type { ReportSection } from "@/platform/reports/pdf";
import { ASSET_TYPE_LABEL } from "./format";
import { listAssets, listServices } from "./queries";

export async function catalogReportData(
  reportKey: string,
  params: Record<string, string>,
  workspaceId: string,
): Promise<ReportSection[] | null> {
  if (reportKey !== "catalog.inventory") return null;
  const sections: ReportSection[] = [];

  if (params.kind !== "assets") {
    const services = await listServices(workspaceId);
    sections.push({
      heading: `Services (${services.length})`,
      table: {
        columns: ["Service", "Criticality", "Status", "Owner", "Org unit"],
        rows: services.map((s) => [
          s.name,
          s.criticality,
          s.status,
          s.ownerName ?? "—",
          s.orgUnitName ?? "—",
        ]),
      },
    });
  }

  if (params.kind !== "services") {
    const assets = (await listAssets(workspaceId)).filter(
      (a) => params.assetType === "all" || a.type === params.assetType,
    );
    sections.push({
      heading: `Assets (${assets.length})`,
      table: {
        columns: ["Asset", "Type", "Classification", "Status", "Location", "Owner"],
        rows: assets.map((a) => [
          a.name,
          ASSET_TYPE_LABEL[a.type] ?? a.type,
          a.classification,
          a.status,
          a.location || "—",
          a.ownerName ?? "—",
        ]),
      },
    });
  }

  return sections;
}
