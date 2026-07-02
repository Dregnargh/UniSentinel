import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";

// ---------------------------------------------------------------------------
// RBAC. Permissions are strings from the code-side catalog
// (module.resource.action, e.g. "platform.users.create"); roles are named,
// workspace-scoped permission sets; a user's effective set is the union of
// their roles. The Administrator system role holds the "*" wildcard so it
// automatically covers permissions added by future modules.
// ---------------------------------------------------------------------------

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // System roles (Administrator, Member) are seeded per workspace and are
    // read-only in the role builder.
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_roles_workspace").on(t.workspaceId),
    uniqueIndex("uq_roles_workspace_name").on(t.workspaceId, t.name),
  ],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    // Catalog permission string, or "*" (Administrator wildcard).
    permission: text("permission").notNull(),
  },
  (t) => [uniqueIndex("uq_role_permissions").on(t.roleId, t.permission)],
);

export type RolePermission = typeof rolePermissions.$inferSelect;

export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_user_roles_user").on(t.userId),
    index("idx_user_roles_role").on(t.roleId),
    uniqueIndex("uq_user_roles").on(t.userId, t.roleId),
  ],
);

export type UserRole = typeof userRoles.$inferSelect;
