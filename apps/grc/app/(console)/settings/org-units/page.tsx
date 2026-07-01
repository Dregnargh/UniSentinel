import type { Metadata } from "next";
import { requireAdmin } from "@/platform/auth/session";
import { buildOrgTree, listOrgUnits } from "@/platform/org/queries";
import { OrgUnitsClient, type OrgUnitRow } from "./OrgUnitsClient";

export const metadata: Metadata = { title: "Organization" };
export const dynamic = "force-dynamic";

export default async function OrgUnitsPage() {
  const { user } = await requireAdmin();
  const rows = await listOrgUnits(user.workspaceId);
  const tree = buildOrgTree(rows);

  // Flatten depth-first with a depth marker for indented rendering.
  const flat: OrgUnitRow[] = [];
  const walk = (nodes: ReturnType<typeof buildOrgTree>, depth: number) => {
    for (const n of nodes) {
      flat.push({ id: n.id, name: n.name, kind: n.kind, parentId: n.parentId, depth, hasChildren: n.children.length > 0 });
      walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);

  return <OrgUnitsClient units={flat} />;
}
