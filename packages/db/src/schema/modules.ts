import { index, jsonb, pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces } from "./core";

// ---------------------------------------------------------------------------
// Module framework: entitlements (which modules a workspace has licensed),
// cross-module entity links, and the domain-event outbox.
// ---------------------------------------------------------------------------

// Which modules are active for a workspace. Rows come from a verified license
// file (on-prem and cloud alike for now); "manual" is reserved for internal /
// billing-driven grants later.
export const moduleEntitlements = pgTable(
  "module_entitlements",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    moduleKey: text("module_key").notNull(),
    status: text("status").notNull().default("active"), // active | expired
    seats: integer("seats"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    source: text("source").notNull().default("license"), // license | manual
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("uq_module_entitlements").on(t.workspaceId, t.moduleKey)],
);

export type ModuleEntitlement = typeof moduleEntitlements.$inferSelect;

// All cross-module references go through this one table (never raw FK columns
// into another module's tables): promotion of fallback data and "what links
// here" queries become uniform. Types are "<module>:<entity>" strings from the
// manifest registry; integrity is enforced at the action layer.
export const entityLinks = pgTable(
  "entity_links",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    linkKind: text("link_kind").notNull().default("relates_to"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_entity_links_source").on(t.workspaceId, t.sourceType, t.sourceId),
    index("idx_entity_links_target").on(t.workspaceId, t.targetType, t.targetId),
    uniqueIndex("uq_entity_links").on(
      t.workspaceId,
      t.sourceType,
      t.sourceId,
      t.targetType,
      t.targetId,
      t.linkKind,
    ),
  ],
);

export type EntityLink = typeof entityLinks.$inferSelect;

// Domain-event outbox: modules emit, listeners react (in-process now; the
// worker and webhooks consume this table later phases).
export const domainEvents = pgTable(
  "domain_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // e.g. "task.completed"
    payload: jsonb("payload").notNull(),
    actorUserId: text("actor_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("idx_domain_events_time").on(t.workspaceId, t.createdAt)],
);

export type DomainEvent = typeof domainEvents.$inferSelect;
