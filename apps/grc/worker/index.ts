// UniSentinel worker process: pg-boss (Postgres-backed) job queue + cron.
// Phase 0 ships one job — a minute heartbeat written to instance_meta — which
// proves the queue infrastructure end-to-end; module jobs register here later.
import PgBoss from "pg-boss";
import { createDb, createPool, instanceMeta, sslConfig } from "@unisentinel/db";
import { createLogger } from "../platform/log";

const log = createLogger("worker");

const HEARTBEAT_QUEUE = "platform.heartbeat";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    log.error("DATABASE_URL is not set — worker cannot start");
    process.exit(1);
  }

  const pool = createPool(url);
  const db = createDb(pool);

  const boss = new PgBoss({
    connectionString: url,
    ssl: sslConfig(),
    schema: "pgboss",
  });
  boss.on("error", (err) => log.error("pg-boss error", { error: String(err) }));

  await boss.start();
  await boss.createQueue(HEARTBEAT_QUEUE);
  await boss.schedule(HEARTBEAT_QUEUE, "* * * * *"); // every minute
  await boss.work(HEARTBEAT_QUEUE, async () => {
    const now = new Date();
    await db
      .insert(instanceMeta)
      .values({ key: "worker.last_heartbeat", value: now.toISOString(), updatedAt: now })
      .onConflictDoUpdate({
        target: instanceMeta.key,
        set: { value: now.toISOString(), updatedAt: now },
      });
    log.debug("heartbeat");
  });

  log.info("worker started", { queues: [HEARTBEAT_QUEUE] });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info("worker stopping", { signal });
    try {
      await boss.stop({ graceful: true, timeout: 15_000 });
      await pool.end();
    } finally {
      process.exit(0);
    }
  };
  // SIGINT/SIGTERM cover Docker and systemd; SIGBREAK covers Windows services.
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGBREAK", () => void shutdown("SIGBREAK"));
}

main().catch((err) => {
  log.error("worker crashed on startup", { error: String(err) });
  process.exit(1);
});
