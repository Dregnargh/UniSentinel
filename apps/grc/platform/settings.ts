import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { settings } from "@unisentinel/db";
import { getDb } from "./db";

// Namespaced, zod-typed workspace settings. Callers pass their schema so a
// malformed row degrades to null instead of crashing the page.

export async function getSetting<T>(
  workspaceId: string,
  namespace: string,
  key: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const { db } = getDb();
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.workspaceId, workspaceId), eq(settings.namespace, namespace), eq(settings.key, key)))
    .limit(1);
  if (!rows[0]) return null;
  const parsed = schema.safeParse(rows[0].value);
  return parsed.success ? parsed.data : null;
}

export async function setSetting(
  workspaceId: string,
  namespace: string,
  key: string,
  value: unknown,
): Promise<void> {
  const { db } = getDb();
  await db
    .insert(settings)
    .values({ id: crypto.randomUUID(), workspaceId, namespace, key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [settings.workspaceId, settings.namespace, settings.key],
      set: { value, updatedAt: new Date() },
    });
}
