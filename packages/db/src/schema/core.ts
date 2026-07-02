import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Platform core: instance meta, tenancy (workspaces), identity (users,
// sessions), org structure and the immutable audit log.
//
// Conventions: text UUID PKs generated app-side (crypto.randomUUID()),
// timestamptz set app-side, enum-ish columns are plain text validated with
// zod at the action layer. Every tenant-owned row carries workspace_id
// (ON DELETE CASCADE). User-reference columns on records that must outlive
// their author use ON DELETE SET NULL.
// ---------------------------------------------------------------------------

export const instanceMeta = pgTable("instance_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type InstanceMeta = typeof instanceMeta.$inferSelect;
export type NewInstanceMeta = typeof instanceMeta.$inferInsert;

// ---- Tenancy ---------------------------------------------------------------

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

// ---- Identity ----------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    // Email delivery preference for notifications (in-app inbox is always on).
    emailNotifications: boolean("email_notifications").notNull().default(true),
    active: boolean("active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    // TOTP 2FA. A non-null secret with totp_enabled=false is a pending
    // enrollment (confirmed by the first valid code).
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    // SHA-256 hex digests of unused one-time recovery codes.
    totpRecoveryCodes: jsonb("totp_recovery_codes").$type<string[]>(),
    // Brute-force lockout.
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_users_workspace").on(t.workspaceId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Server-side session records: the cookie only carries a signed session id,
// so admins/users can revoke sessions and revocation is effective immediately.
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("idx_sessions_user").on(t.userId)],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// ---- Org structure -----------------------------------------------------------

// Company -> business line -> department tree. Platform-level (not a module)
// because RBAC data-scopes and several modules reference it.
export const orgUnits = pgTable(
  "org_units",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnyPgColumn => orgUnits.id),
    name: text("name").notNull(),
    // company | business_line | department | team — display taxonomy only.
    kind: text("kind").notNull().default("department"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_org_units_workspace").on(t.workspaceId)],
);

export type OrgUnit = typeof orgUnits.$inferSelect;
export type NewOrgUnit = typeof orgUnits.$inferInsert;

// ---- Audit log ----------------------------------------------------------------

// Append-only. Actor identity is SNAPSHOTTED (id/name/email, no FK — an audit
// entry is a historical record: deleting a user must not touch it, and the
// immutability trigger would rightly reject the SET NULL update an FK would
// cause). A DB trigger (see the audit-log-immutable migration) rejects
// UPDATE/DELETE below the app layer.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id"),
    actorName: text("actor_name").notNull(),
    actorEmail: text("actor_email").notNull(),
    // Dot-form verb, e.g. "user.created", "auth.login", "org_unit.deleted".
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    diff: jsonb("diff").$type<{ before?: unknown; after?: unknown }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_audit_log_workspace_time").on(t.workspaceId, t.createdAt),
    index("idx_audit_log_entity").on(t.workspaceId, t.entityType, t.entityId),
  ],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
