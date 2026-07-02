import { inArray } from "drizzle-orm";
import { notifications, users } from "@unisentinel/db";
import { getDb } from "../db";
import { createLogger } from "../log";
import { getMailSettings } from "./mail";
import { enqueueEmail } from "./queue";

const log = createLogger("notify");

/**
 * Fan a notification out to users: always the in-app inbox; email additionally
 * when SMTP is configured and the recipient has email delivery enabled.
 * Email problems never fail the caller's mutation — they log and move on.
 */
export async function notify(input: {
  workspaceId: string;
  userIds: string[];
  type: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  if (input.userIds.length === 0) return;
  const { db } = getDb();
  const now = new Date();
  await db.insert(notifications).values(
    input.userIds.map((userId) => ({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      createdAt: now,
    })),
  );

  try {
    const mailConfigured = (await getMailSettings(input.workspaceId)) !== null;
    if (!mailConfigured) return;
    const recipients = await db
      .select({ id: users.id, email: users.email, emailNotifications: users.emailNotifications })
      .from(users)
      .where(inArray(users.id, input.userIds));
    await Promise.all(
      recipients
        .filter((r) => r.emailNotifications)
        .map((r) =>
          enqueueEmail({
            workspaceId: input.workspaceId,
            to: r.email,
            subject: `UniSentinel — ${input.title}`,
            text: input.body,
          }),
        ),
    );
  } catch (err) {
    log.warn("email fan-out failed (in-app notification delivered)", { error: String(err) });
  }
}
