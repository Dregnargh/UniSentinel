import { asc } from "drizzle-orm";
import { z } from "zod";
import { workspaces } from "@unisentinel/db";
import { getDb } from "./db";
import { getSetting } from "./settings";

export const brandingSchema = z.object({
  logoKey: z.string().min(1),
  contentType: z.string().min(1),
});

export type Branding = z.infer<typeof brandingSchema>;

export async function getBranding(workspaceId: string): Promise<Branding | null> {
  return getSetting(workspaceId, "branding", "logo", brandingSchema);
}

/**
 * Instance-level branding for unauthenticated surfaces (the login screen).
 * An on-prem instance has exactly one workspace; for multi-workspace cloud the
 * oldest workspace's logo stands in until per-tenant domains (Phase 10).
 */
export async function getInstanceBranding(): Promise<Branding | null> {
  const { db } = getDb();
  if (!process.env.DATABASE_URL) return null;
  try {
    const rows = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .orderBy(asc(workspaces.createdAt))
      .limit(1);
    if (!rows[0]) return null;
    return getBranding(rows[0].id);
  } catch {
    return null;
  }
}
