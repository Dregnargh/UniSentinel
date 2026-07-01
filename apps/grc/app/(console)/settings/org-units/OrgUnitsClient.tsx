"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Select, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { createOrgUnit, deleteOrgUnit, updateOrgUnit } from "@/platform/org/actions";

export interface OrgUnitRow {
  id: string;
  name: string;
  kind: string;
  parentId: string | null;
  depth: number;
  hasChildren: boolean;
}

const KIND_LABEL: Record<string, string> = {
  company: "Company",
  business_line: "Business line",
  department: "Department",
  team: "Team",
};

export function OrgUnitsClient({ units }: { units: OrgUnitRow[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = React.useState<OrgUnitRow | null>(null);

  const remove = (unit: OrgUnitRow) =>
    startTransition(async () => {
      const result = await deleteOrgUnit(unit.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Organization</h1>
          <p>
            Company structure — business lines, departments, teams. Modules use these units for
            ownership, scoping and reporting.
          </p>
        </div>
        <AddUnitButton units={units} />
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          {units.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No units yet — start with your company, then add business lines and departments under it.
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Unit</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell align="right">Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {units.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell>
                      <span style={{ paddingLeft: u.depth * 20 }}>
                        {u.depth > 0 && <span className="muted">└ </span>}
                        {u.name}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone="neutral">{KIND_LABEL[u.kind] ?? u.kind}</Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => setEditTarget(u)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" disabled={pending || u.hasChildren} onClick={() => remove(u)}>
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
      <EditUnitModal target={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}

function KindSelect({ id, defaultValue }: { id: string; defaultValue?: string }) {
  return (
    <Select id={id} name="kind" defaultValue={defaultValue ?? "department"}>
      <option value="company">Company</option>
      <option value="business_line">Business line</option>
      <option value="department">Department</option>
      <option value="team">Team</option>
    </Select>
  );
}

function AddUnitButton({ units }: { units: OrgUnitRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createOrgUnit, {});
  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add unit</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add organizational unit" size="md">
        <form action={action}>
          <Modal.Body>
            <div className="form-grid">
              {state.error && <Alert tone="danger">{state.error}</Alert>}
              <label htmlFor="unit-name">Name</label>
              <Input id="unit-name" name="name" required placeholder="Information Security" />
              <label htmlFor="unit-kind">Type</label>
              <KindSelect id="unit-kind" />
              <label htmlFor="unit-parent">Parent</label>
              <Select id="unit-parent" name="parentId" defaultValue="">
                <option value="">— none (top level) —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {" ".repeat(u.depth * 3)}
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create unit
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}

function EditUnitModal({ target, onClose }: { target: OrgUnitRow | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrgUnit, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={target !== null} onClose={onClose} title="Edit unit" size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="unitId" value={target?.id ?? ""} />
            <label htmlFor="edit-unit-name">Name</label>
            <Input id="edit-unit-name" name="name" defaultValue={target?.name} required />
            <label htmlFor="edit-unit-kind">Type</label>
            {target && <KindSelect id="edit-unit-kind" defaultValue={target.kind} />}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Save
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
