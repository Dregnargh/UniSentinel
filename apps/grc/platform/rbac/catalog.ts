// Permission catalog. Format: module.resource.action. The platform section is
// defined here; modules contribute their own sections through their manifests
// (Phase 3) and the catalog is assembled at build time from all of them.
// The "*" wildcard (Administrator system role) matches everything, so new
// module permissions are automatically covered for admins.

export interface PermissionAction {
  action: string;
  label: string;
}

export interface PermissionResource {
  resource: string;
  label: string;
  description: string;
  actions: PermissionAction[];
}

export interface PermissionGroup {
  module: string;
  label: string;
  resources: PermissionResource[];
}

export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    module: "platform",
    label: "Platform",
    resources: [
      {
        resource: "users",
        label: "Users",
        description: "Workspace member accounts",
        actions: [
          { action: "view", label: "View users" },
          { action: "create", label: "Create users" },
          { action: "edit", label: "Edit users (activate, deactivate, assign roles)" },
          { action: "reset_password", label: "Reset passwords" },
          { action: "delete", label: "Delete users" },
        ],
      },
      {
        resource: "roles",
        label: "Roles & permissions",
        description: "The role builder",
        actions: [
          { action: "view", label: "View roles" },
          { action: "manage", label: "Create, edit and delete roles" },
        ],
      },
      {
        resource: "org_units",
        label: "Organization structure",
        description: "Business lines, departments, teams",
        actions: [
          { action: "view", label: "View organization" },
          { action: "manage", label: "Create, edit and delete units" },
        ],
      },
      {
        resource: "audit_log",
        label: "Audit log",
        description: "The append-only activity record",
        actions: [{ action: "view", label: "View the audit log" }],
      },
      {
        resource: "settings",
        label: "Workspace settings",
        description: "Mail (SMTP) and other workspace configuration",
        actions: [{ action: "manage", label: "Manage settings" }],
      },
    ],
  },
];

/** Every valid permission string in the catalog (excludes the "*" wildcard). */
export function allPermissions(): string[] {
  return PERMISSION_CATALOG.flatMap((g) =>
    g.resources.flatMap((r) => r.actions.map((a) => `${g.module}.${r.resource}.${a.action}`)),
  );
}

const VALID = new Set(allPermissions());

export function isValidPermission(p: string): boolean {
  return VALID.has(p);
}

/** Set-membership check honoring the Administrator wildcard. */
export function permitted(set: ReadonlySet<string>, permission: string): boolean {
  return set.has("*") || set.has(permission);
}

// Shorthands used across the app.
export const P = {
  usersView: "platform.users.view",
  usersCreate: "platform.users.create",
  usersEdit: "platform.users.edit",
  usersResetPassword: "platform.users.reset_password",
  usersDelete: "platform.users.delete",
  rolesView: "platform.roles.view",
  rolesManage: "platform.roles.manage",
  orgView: "platform.org_units.view",
  orgManage: "platform.org_units.manage",
  auditView: "platform.audit_log.view",
  settingsManage: "platform.settings.manage",
} as const;
