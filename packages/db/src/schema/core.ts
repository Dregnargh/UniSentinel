import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Platform core. Phase 0 ships only instance_meta — a tiny key/value table the
// instance uses for self-describing state (readiness probes, worker heartbeat,
// setup progress). Tenancy/auth tables arrive in Phase 1.
// ---------------------------------------------------------------------------

export const instanceMeta = pgTable("instance_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type InstanceMeta = typeof instanceMeta.$inferSelect;
export type NewInstanceMeta = typeof instanceMeta.$inferInsert;
