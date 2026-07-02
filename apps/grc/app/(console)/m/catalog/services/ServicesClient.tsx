"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Select, Table, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { ServiceRow } from "@/modules/catalog/queries";
import { deleteService, saveService } from "@/modules/catalog/actions";
import { criticalityTone, statusTone } from "@/modules/catalog/format";

interface Option {
  id: string;
  name: string;
}

export function ServicesClient({
  services,
  owners,
  orgUnits,
  canManage,
}: {
  services: ServiceRow[];
  owners: Option[];
  orgUnits: Option[];
  canManage: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [editorTarget, setEditorTarget] = React.useState<ServiceRow | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  const remove = (service: ServiceRow) =>
    startTransition(async () => {
      const result = await deleteService(service.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Services</h1>
          <p>Business services and processes, with criticality and ownership.</p>
        </div>
        {canManage && <Button onClick={() => setEditorTarget("new")}>New service</Button>}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <div style={{ maxWidth: 320, marginBottom: "var(--us-space-4)" }}>
            <Input placeholder="Search services…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {visible.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {services.length === 0 ? "No services yet." : "No services match the search."}
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Service</Table.HeaderCell>
                  <Table.HeaderCell>Criticality</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Owner</Table.HeaderCell>
                  <Table.HeaderCell>Org unit</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visible.map((s) => (
                  <Table.Row key={s.id}>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      {s.description && (
                        <div className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
                          {s.description.length > 90 ? s.description.slice(0, 90) + "…" : s.description}
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={criticalityTone[s.criticality] ?? "neutral"}>{s.criticality}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={statusTone[s.status] ?? "neutral"} dot>
                        {s.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{s.ownerName ?? <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>{s.orgUnitName ?? <span className="muted">—</span>}</Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <Button size="sm" variant="ghost" onClick={() => setEditorTarget(s)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(s)}>
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
      <ServiceEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        owners={owners}
        orgUnits={orgUnits}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}

function ServiceEditorModal({
  target,
  owners,
  orgUnits,
  onClose,
}: {
  target: ServiceRow | "new" | null;
  owners: Option[];
  orgUnits: Option[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const service = isNew || target === null ? null : target;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveService, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={target !== null} onClose={onClose} title={isNew ? "New service" : `Edit — ${service?.name}`} size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="serviceId" value={service?.id ?? ""} />}
            <label htmlFor="svc-name">Name</label>
            <Input id="svc-name" name="name" defaultValue={service?.name} required placeholder="Customer Billing" />
            <label htmlFor="svc-desc">Description</label>
            <Textarea id="svc-desc" name="description" defaultValue={service?.description} rows={2} />
            <label htmlFor="svc-criticality">Criticality</label>
            <Select id="svc-criticality" name="criticality" defaultValue={service?.criticality ?? "medium"}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <label htmlFor="svc-status">Status</label>
            <Select id="svc-status" name="status" defaultValue={service?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="retired">Retired</option>
            </Select>
            <label htmlFor="svc-owner">Owner</label>
            <Select id="svc-owner" name="ownerUserId" defaultValue="">
              <option value="">— none —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            <label htmlFor="svc-org">Org unit</label>
            <Select id="svc-org" name="orgUnitId" defaultValue="">
              <option value="">— none —</option>
              {orgUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isNew ? "Create service" : "Save"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
