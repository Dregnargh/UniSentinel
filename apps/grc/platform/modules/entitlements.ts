import { cache } from "react";
import { eq } from "drizzle-orm";
import { moduleEntitlements } from "@unisentinel/db";
import { getDb } from "../db";

export interface EntitlementInfo {
  moduleKey: string;
  status: "active" | "expired";
  seats: number | null;
  expiresAt: Date | null;
}

/** All entitlements for a workspace, expiry evaluated at read time. */
export const getEntitlements = cache(async (workspaceId: string): Promise<Map<string, EntitlementInfo>> => {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(moduleEntitlements)
    .where(eq(moduleEntitlements.workspaceId, workspaceId));
  const now = Date.now();
  return new Map(
    rows.map((r) => [
      r.moduleKey,
      {
        moduleKey: r.moduleKey,
        status: r.expiresAt && r.expiresAt.getTime() < now ? "expired" : (r.status as "active" | "expired"),
        seats: r.seats,
        expiresAt: r.expiresAt,
      },
    ]),
  );
});

export async function isModuleEnabled(workspaceId: string, moduleKey: string): Promise<boolean> {
  const entitlements = await getEntitlements(workspaceId);
  return entitlements.get(moduleKey)?.status === "active";
}
