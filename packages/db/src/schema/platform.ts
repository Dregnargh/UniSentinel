import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";

// ---------------------------------------------------------------------------
// Settings: namespaced key/value store (typed with zod at the access layer).
// Workspace-scoped everywhere — an on-prem instance is a single workspace, so
// instance settings and workspace settings are the same rows. Secret values
// (SMTP password, connector credentials) are encrypted at rest by the access
// layer before they reach this table.
// ---------------------------------------------------------------------------

export const settings = pgTable(
  "settings",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    namespace: text("namespace").notNull(), // e.g. "mail", "branding", "auth_policy"
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("uq_settings").on(t.workspaceId, t.namespace, t.key)],
);

export type Setting = typeof settings.$inferSelect;

// ---------------------------------------------------------------------------
// In-app notifications (the bell). Email delivery is a worker job; this table
// is the inbox.
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // e.g. "role.assigned", "mail.test"
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_notifications_user_time").on(t.userId, t.createdAt)],
);

export type Notification = typeof notifications.$inferSelect;
