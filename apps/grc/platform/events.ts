import { eq } from "drizzle-orm";
import { domainEvents } from "@unisentinel/db";
import { getDb } from "./db";
import { createLogger } from "./log";
import { allEventTypes } from "@/modules/registry";

// Domain events: persisted to the outbox (webhooks/async consumers read it in
// later phases) and dispatched synchronously to registered in-process
// listeners. Modules register listeners from their server wiring; a listener
// for an unlicensed module is simply never registered.

const log = createLogger("events");

type Listener = (event: {
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
  actorUserId: string | null;
}) => Promise<void>;

const listeners = new Map<string, Listener[]>();

export function onEvent(type: string, listener: Listener): void {
  (listeners.get(type) ?? listeners.set(type, []).get(type)!).push(listener);
}

export async function emitEvent(event: {
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
  actorUserId?: string | null;
}): Promise<void> {
  if (!allEventTypes().has(event.type)) {
    log.warn("emitting unregistered event type", { type: event.type });
  }
  const { db } = getDb();
  const id = crypto.randomUUID();
  await db.insert(domainEvents).values({
    id,
    workspaceId: event.workspaceId,
    type: event.type,
    payload: event.payload,
    actorUserId: event.actorUserId ?? null,
    createdAt: new Date(),
  });
  for (const listener of listeners.get(event.type) ?? []) {
    try {
      await listener({ ...event, actorUserId: event.actorUserId ?? null });
    } catch (err) {
      // A failing listener never fails the emitting mutation.
      log.error("event listener failed", { type: event.type, error: String(err) });
    }
  }
  const { db: markDb } = getDb();
  await markDb
    .update(domainEvents)
    .set({ processedAt: new Date() })
    .where(eq(domainEvents.id, id))
    .catch(() => {});
}
