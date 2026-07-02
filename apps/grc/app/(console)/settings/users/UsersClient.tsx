"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { createWorkspaceUser, deleteWorkspaceUser, resetUserPassword, setUserActive } from "@/platform/users/actions";
import { setUserRoles } from "@/platform/roles/actions";

interface RoleOption {
  id: string;
  name: string;
  isSystem: boolean;
}

interface MemberRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  createdAt: string;
  roles: { id: string; name: string }[];
}

interface Can {
  create: boolean;
  edit: boolean;
  resetPassword: boolean;
  del: boolean;
}

export function UsersClient({
  meId,
  can,
  allRoles,
  members,
}: {
  meId: string;
  can: Can;
  allRoles: RoleOption[];
  members: MemberRow[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [rolesTarget, setRolesTarget] = React.useState<MemberRow | null>(null);
  const [resetTarget, setResetTarget] = React.useState<MemberRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MemberRow | null>(null);

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Accounts in this workspace. New users get the Member role and a temporary password.</p>
        </div>
        {can.create && <AddUserButton />}
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
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Roles</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>2FA</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {members.map((m) => (
                <Table.Row key={m.id}>
                  <Table.Cell>
                    {m.name}
                    {m.id === meId && (
                      <span className="muted" style={{ marginLeft: 8, fontSize: "var(--us-text-xs)" }}>
                        (you)
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell>{m.email}</Table.Cell>
                  <Table.Cell>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {m.roles.length === 0 ? (
                        <span className="muted">none</span>
                      ) : (
                        m.roles.map((r) => (
                          <Badge key={r.id} tone={r.name === "Administrator" ? "brand" : "neutral"}>
                            {r.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {m.active ? (
                      <Badge tone="success" dot>
                        active
                      </Badge>
                    ) : (
                      <Badge tone="danger" dot>
                        deactivated
                      </Badge>
                    )}
                    {m.mustChangePassword && (
                      <Badge tone="warning" style={{ marginLeft: 6 }}>
                        temp password
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {m.totpEnabled ? <Badge tone="success">on</Badge> : <span className="muted">off</span>}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {can.edit && (
                        <Button size="sm" variant="outline" onClick={() => setRolesTarget(m)}>
                          Roles
                        </Button>
                      )}
                      {m.id !== meId && (
                        <>
                          {can.edit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => run(() => setUserActive(m.id, !m.active))}
                            >
                              {m.active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          {can.resetPassword && (
                            <Button size="sm" variant="ghost" onClick={() => setResetTarget(m)}>
                              Reset password
                            </Button>
                          )}
                          {can.del && (
                            <Button size="sm" variant="danger" onClick={() => setDeleteTarget(m)}>
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      <RolesModal key={rolesTarget?.id ?? "none"} target={rolesTarget} allRoles={allRoles} onClose={() => setRolesTarget(null)} />
      <ResetPasswordModal key={resetTarget?.id ?? "none"} target={resetTarget} onClose={() => setResetTarget(null)} />
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete user" size="sm">
        <Modal.Body>
          Permanently delete <strong>{deleteTarget?.email}</strong>? Their sessions end immediately.
          Audit history they authored is preserved.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() => {
              if (deleteTarget) run(() => deleteWorkspaceUser(deleteTarget.id));
              setDeleteTarget(null);
            }}
          >
            Delete user
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function RolesModal({
  target,
  allRoles,
  onClose,
}: {
  target: MemberRow | null;
  allRoles: RoleOption[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setUserRoles, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={target !== null} onClose={onClose} title={`Roles — ${target?.email ?? ""}`} size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="userId" value={target?.id ?? ""} />
            {allRoles.map((r) => (
              <Checkbox
                key={r.id}
                name="roleId"
                value={r.id}
                defaultChecked={target?.roles.some((tr) => tr.id === r.id) ?? false}
                label={r.name}
                description={r.isSystem ? "System role" : undefined}
              />
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Save roles
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function AddUserButton() {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createWorkspaceUser, {});
  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add user</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add user" size="md">
        <form action={action}>
          <Modal.Body>
            <div className="form-grid">
              {state.error && <Alert tone="danger">{state.error}</Alert>}
              <label htmlFor="new-name">Name</label>
              <Input id="new-name" name="name" required placeholder="Jane Smith" />
              <label htmlFor="new-email">Email</label>
              <Input id="new-email" name="email" type="email" required placeholder="jane@company.com" />
              <label htmlFor="new-password">Temporary password</label>
              <Input id="new-password" name="password" type="text" required minLength={12} placeholder="Share this with them securely" />
              <p className="muted" style={{ margin: 0, fontSize: "var(--us-text-sm)" }}>
                They start with the Member role — assign more from the Roles button afterwards.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create user
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}

function ResetPasswordModal({ target, onClose }: { target: MemberRow | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetUserPassword, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={target !== null} onClose={onClose} title={`Reset password — ${target?.email ?? ""}`} size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="userId" value={target?.id ?? ""} />
            <label htmlFor="reset-password">New temporary password</label>
            <Input id="reset-password" name="password" type="text" required minLength={12} />
            <p className="muted" style={{ margin: 0, fontSize: "var(--us-text-sm)" }}>
              They'll be forced to change it at next sign-in. This also clears any lockout.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Reset password
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
