import { asc, eq } from "drizzle-orm";
import { orgUnits, type OrgUnit } from "@unisentinel/db";
import { getDb } from "../db";

export interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[];
}

export async function listOrgUnits(workspaceId: string): Promise<OrgUnit[]> {
  const { db } = getDb();
  return db
    .select()
    .from(orgUnits)
    .where(eq(orgUnits.workspaceId, workspaceId))
    .orderBy(asc(orgUnits.sortOrder), asc(orgUnits.createdAt));
}

/** Assembles the flat rows into a tree (roots first, children nested). */
export function buildOrgTree(rows: OrgUnit[]): OrgUnitNode[] {
  const byId = new Map<string, OrgUnitNode>(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots: OrgUnitNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
