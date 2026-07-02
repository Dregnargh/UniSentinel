import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { notifications } from "@unisentinel/db";
import { getDb } from "../db";

export interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  at: string;
}

export async function getInbox(userId: string): Promise<{ items: InboxItem[]; unread: number }> {
  const { db } = getDb();
  const [items, unread] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(15),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);
  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.readAt !== null,
      at: n.createdAt.toISOString(),
    })),
    unread: unread[0]?.count ?? 0,
  };
}
