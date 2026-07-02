// pg-boss sender for the web process (the worker owns the handlers). Cached on
// globalThis like the db pool; starting an instance is cheap and idempotent
// (the pgboss schema already exists once the worker or a previous send ran).
import PgBoss from "pg-boss";
import { sslConfig } from "@unisentinel/db";

export const EMAIL_QUEUE = "platform.email";

export interface EmailJob {
  workspaceId: string;
  to: string;
  subject: string;
  text: string;
}

const globalCache = globalThis as unknown as { __usBoss?: Promise<PgBoss> };

async function getBoss(): Promise<PgBoss> {
  if (!globalCache.__usBoss) {
    globalCache.__usBoss = (async () => {
      const boss = new PgBoss({
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig(),
        schema: "pgboss",
      });
      boss.on("error", () => {});
      await boss.start();
      await boss.createQueue(EMAIL_QUEUE).catch(() => {}); // exists after first call
      return boss;
    })();
  }
  return globalCache.__usBoss;
}

/** Fire-and-forget enqueue; delivery failures are the worker's to retry. */
export async function enqueueEmail(job: EmailJob): Promise<void> {
  const boss = await getBoss();
  await boss.send(EMAIL_QUEUE, { ...job });
}
