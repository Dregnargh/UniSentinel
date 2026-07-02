"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Select, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import {
  createDataFlow,
  createRelationship,
  deleteDataFlow,
  deleteRelationship,
} from "@/modules/catalog/actions";
import { RELATIONSHIP_KINDS, RELATIONSHIP_LABEL, classificationTone } from "@/modules/catalog/format";

interface Endpoint {
  ref: string;
  label: string;
}

export function ConnectionsClient({
  endpoints,
  relationships,
  flows,
  canManage,
}: {
  endpoints: Endpoint[];
  relationships: { id: string; source: string; target: string; kind: string }[];
  flows: { id: string; source: string; target: string; name: string; classification: string; protocol: string }[];
  canManage: boolean;
}) {
  const [relOpen, setRelOpen] = React.useState(false);
  const [flowOpen, setFlowOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Connections</h1>
          <p>Relationships and data flows between services and assets — these draw the map.</p>
        </div>
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title subtitle="Structural relationships (hosts, connects to, depends on…)">Relationships</Card.Title>
        </Card.Header>
        <Card.Body>
          {canManage && (
            <div style={{ marginBottom: "var(--us-space-4)" }}>
              <Button size="sm" onClick={() => setRelOpen(true)}>
                New relationship
              </Button>
            </div>
          )}
          {relationships.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              None yet.
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Source</Table.HeaderCell>
                  <Table.HeaderCell>Relationship</Table.HeaderCell>
                  <Table.HeaderCell>Target</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {relationships.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell>{r.source}</Table.Cell>
                    <Table.Cell>
                      <Badge tone="neutral">{RELATIONSHIP_LABEL[r.kind] ?? r.kind}</Badge>
                    </Table.Cell>
                    <Table.Cell>{r.target}</Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => deleteRelationship(r.id))}>
                          Delete
                        </Button>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title subtitle="Who sends what to whom, with data classification">Data flows</Card.Title>
        </Card.Header>
        <Card.Body>
          {canManage && (
            <div style={{ marginBottom: "var(--us-space-4)" }}>
              <Button size="sm" onClick={() => setFlowOpen(true)}>
                New data flow
              </Button>
            </div>
          )}
          {flows.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              None yet.
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Source</Table.HeaderCell>
                  <Table.HeaderCell>Target</Table.HeaderCell>
                  <Table.HeaderCell>Data</Table.HeaderCell>
                  <Table.HeaderCell>Classification</Table.HeaderCell>
                  <Table.HeaderCell>Protocol</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {flows.map((f) => (
                  <Table.Row key={f.id}>
                    <Table.Cell>{f.source}</Table.Cell>
                    <Table.Cell>{f.target}</Table.Cell>
                    <Table.Cell>{f.name || <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>
                      <Badge tone={classificationTone[f.classification] ?? "neutral"}>{f.classification}</Badge>
                    </Table.Cell>
                    <Table.Cell>{f.protocol || <span className="muted">—</span>}</Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => deleteDataFlow(f.id))}>
                          Delete
                        </Button>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>

      <RelationshipModal key={relOpen ? "r-open" : "r-closed"} open={relOpen} endpoints={endpoints} onClose={() => setRelOpen(false)} />
      <DataFlowModal key={flowOpen ? "f-open" : "f-closed"} open={flowOpen} endpoints={endpoints} onClose={() => setFlowOpen(false)} />
    </div>
  );
}

function EndpointSelect({ id, name, endpoints, label }: { id: string; name: string; endpoints: Endpoint[]; label: string }) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <Select id={id} name={name} defaultValue="" required>
        <option value="" disabled>
          — pick —
        </option>
        {endpoints.map((e) => (
          <option key={e.ref} value={e.ref}>
            {e.label}
          </option>
        ))}
      </Select>
    </>
  );
}

function RelationshipModal({ open, endpoints, onClose }: { open: boolean; endpoints: Endpoint[]; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createRelationship, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={open} onClose={onClose} title="New relationship" size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <EndpointSelect id="rel-source" name="sourceRef" endpoints={endpoints} label="Source" />
            <label htmlFor="rel-kind">Relationship</label>
            <Select id="rel-kind" name="kind" defaultValue="depends_on">
              {RELATIONSHIP_KINDS.map((k) => (
                <option key={k} value={k}>
                  {RELATIONSHIP_LABEL[k]}
                </option>
              ))}
            </Select>
            <EndpointSelect id="rel-target" name="targetRef" endpoints={endpoints} label="Target" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Connect
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function DataFlowModal({ open, endpoints, onClose }: { open: boolean; endpoints: Endpoint[]; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createDataFlow, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={open} onClose={onClose} title="New data flow" size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <EndpointSelect id="flow-source" name="sourceRef" endpoints={endpoints} label="Source" />
            <EndpointSelect id="flow-target" name="targetRef" endpoints={endpoints} label="Target" />
            <label htmlFor="flow-name">Data description</label>
            <Input id="flow-name" name="name" placeholder="Customer PII" />
            <label htmlFor="flow-classification">Classification</label>
            <Select id="flow-classification" name="dataClassification" defaultValue="internal">
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </Select>
            <label htmlFor="flow-protocol">Protocol</label>
            <Input id="flow-protocol" name="protocol" placeholder="HTTPS / SFTP / JDBC" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Create flow
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
