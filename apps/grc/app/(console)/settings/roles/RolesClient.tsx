"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Table, Textarea } from "@unisentinel/ui";
import type { PermissionGroup } from "@/platform/rbac/catalog";
import type { RoleSummary } from "@/platform/roles/queries";
import type { ActionState } from "@/platform/auth/actions";
import { createRole, deleteRole, updateRole } from "@/platform/roles/actions";

export function RolesClient({
  roles,
  catalog,
  canManage,
}: {
  roles: RoleSummary[];
  catalog: PermissionGroup[];
  canManage: boolean;
}) {
  const [editorTarget, setEditorTarget] = React.useState<RoleSummary | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (role: RoleSummary) =>
    startTransition(async () => {
      const result = await deleteRole(role.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Roles</h1>
          <p>
            Roles are named permission sets. Users can hold several roles — their access is the
            union. System roles are managed by the platform.
          </p>
        </div>
        {canManage && <Button onClick={() => setEditorTarget("new")}>New role</Button>}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <Table hoverable>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Role</Table.HeaderCell>
                <Table.HeaderCell>Permissions</Table.HeaderCell>
                <Table.HeaderCell>Members</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {roles.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <div style={{ fontWeight: 500 }}>
                      {r.name}{" "}
                      {r.isSystem && (
                        <Badge tone="brand" style={{ marginLeft: 6 }}>
                          system
                        </Badge>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
                      {r.description}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {r.permissions.includes("*") ? (
                      <Badge tone="warning">all permissions</Badge>
                    ) : (
                      `${r.permissions.length}`
                    )}
                  </Table.Cell>
                  <Table.Cell>{r.memberCount}</Table.Cell>
                  <Table.Cell align="right">
                    {canManage && !r.isSystem && (
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => setEditorTarget(r)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={pending || r.memberCount > 0}
                          onClick={() => remove(r)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
      <RoleEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        catalog={catalog}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}

function RoleEditorModal({
  target,
  catalog,
  onClose,
}: {
  target: RoleSummary | "new" | null;
  catalog: PermissionGroup[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const role = isNew || target === null ? null : target;
  const action = isNew ? createRole : updateRole;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={isNew ? "New role" : `Edit role — ${role?.name ?? ""}`}
      size="lg"
    >
      <form action={formAction}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="roleId" value={role?.id ?? ""} />}
            <label htmlFor="role-name">Name</label>
            <Input id="role-name" name="name" defaultValue={role?.name} required placeholder="Risk Viewer" />
            <label htmlFor="role-desc">Description</label>
            <Textarea id="role-desc" name="description" defaultValue={role?.description} rows={2} />
            <label>Permissions</label>
            {catalog.map((group) => (
              <fieldset key={group.module} className="perm-group">
                <legend>{group.label}</legend>
                {group.resources.map((resource) => (
                  <div key={resource.resource} className="perm-resource">
                    <div className="perm-resource__label">
                      {resource.label}
                      <span className="muted"> — {resource.description}</span>
                    </div>
                    <div className="perm-resource__actions">
                      {resource.actions.map((a) => {
                        const value = `${group.module}.${resource.resource}.${a.action}`;
                        return (
                          <Checkbox
                            key={value}
                            name="perm"
                            value={value}
                            defaultChecked={role?.permissions.includes(value) ?? false}
                            label={a.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isNew ? "Create role" : "Save role"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
