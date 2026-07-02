"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notifications, users } from "@unisentinel/db";
import { getDb } from "../db";
import { requireSession } from "../auth/session";
import type { ActionState } from "../auth/actions";

export async function markAllNotificationsRead(): Promise<ActionState> {
  const { user } = await requireSession();
  const { db } = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setEmailNotifications(enabled: boolean): Promise<ActionState> {
  const { user } = await requireSession();
  const { db } = getDb();
  await db
    .update(users)
    .set({ emailNotifications: enabled, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  revalidatePath("/profile");
  return { ok: true };
}
