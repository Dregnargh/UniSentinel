-- Data migration: replace the users.role placeholder with RBAC system roles,
-- then drop the column. Runs after 0003 created roles/role_permissions/
-- user_roles. New workspaces get their system roles app-side (setup wizard);
-- this backfills workspaces that existed before RBAC.
INSERT INTO "roles" (id, workspace_id, name, description, is_system, created_at, updated_at)
SELECT gen_random_uuid()::text, w.id, 'Administrator',
       'Full access to everything, including permissions added by future modules.',
       true, now(), now()
FROM "workspaces" w
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r.workspace_id = w.id AND r.name = 'Administrator' AND r.is_system
);
--> statement-breakpoint
INSERT INTO "roles" (id, workspace_id, name, description, is_system, created_at, updated_at)
SELECT gen_random_uuid()::text, w.id, 'Member',
       'Baseline access: personal profile and licensed module content, no administration.',
       true, now(), now()
FROM "workspaces" w
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r.workspace_id = w.id AND r.name = 'Member' AND r.is_system
);
--> statement-breakpoint
INSERT INTO "role_permissions" (id, role_id, permission)
SELECT gen_random_uuid()::text, r.id, '*'
FROM "roles" r
WHERE r.is_system AND r.name = 'Administrator'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp WHERE rp.role_id = r.id AND rp.permission = '*'
  );
--> statement-breakpoint
INSERT INTO "user_roles" (id, workspace_id, user_id, role_id, created_at)
SELECT gen_random_uuid()::text, u.workspace_id, u.id, r.id, now()
FROM "users" u
JOIN "roles" r
  ON r.workspace_id = u.workspace_id
 AND r.is_system
 AND r.name = CASE WHEN u.role = 'admin' THEN 'Administrator' ELSE 'Member' END
WHERE NOT EXISTS (
  SELECT 1 FROM "user_roles" ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";
