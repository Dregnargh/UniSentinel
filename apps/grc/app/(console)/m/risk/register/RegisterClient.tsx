"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Select, Table, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { RiskRow } from "@/modules/risk/queries";
import { deleteRisk, saveRisk } from "@/modules/risk/actions";
import {
  BAND_LABEL,
  bandFor,
  bandTone,
  riskScore,
  type Methodology,
} from "@/modules/risk/methodology";

interface Option {
  id: string;
  name: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  assessed: "Assessed",
  in_treatment: "In treatment",
  accepted: "Accepted",
  closed: "Closed",
};

export function ScoreBadge({ l, i, m }: { l: number | null; i: number | null; m: Methodology }) {
  if (!l || !i) return <span className="muted">—</span>;
  const score = riskScore(l, i);
  const band = bandFor(score, m);
  return (
    <Badge tone={bandTone[band]}>
      {score} · {BAND_LABEL[band]}
    </Badge>
  );
}

export function RegisterClient({
  risks,
  methodology,
  owners,
  orgUnits,
  canManage,
  canDelete,
}: {
  risks: RiskRow[];
  methodology: Methodology;
  owners: Option[];
  orgUnits: Option[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [editorTarget, setEditorTarget] = React.useState<RiskRow | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = risks.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (r.title.toLowerCase().includes(query.toLowerCase()) || r.ref.toLowerCase().includes(query.toLowerCase())),
  );

  const remove = (risk: RiskRow) =>
    startTransition(async () => {
      const result = await deleteRisk(risk.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Risk register</h1>
          <p>
            Scored on the {methodology.likelihood.length}×{methodology.impact.length} matrix — inherent and
            residual.
          </p>
        </div>
        {canManage && <Button onClick={() => setEditorTarget("new")}>New risk</Button>}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <div style={{ display: "flex", gap: "var(--us-space-2)", marginBottom: "var(--us-space-4)", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 280, flex: 1, minWidth: 200 }}>
              <Input placeholder="Search risks…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="seg">
              <button type="button" data-active={statusFilter === "all" || undefined} onClick={() => setStatusFilter("all")}>
                All
              </button>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  data-active={statusFilter === value || undefined}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {risks.length === 0 ? "No risks yet." : "No risks match."}
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Ref</Table.HeaderCell>
                  <Table.HeaderCell>Risk</Table.HeaderCell>
                  <Table.HeaderCell>Owner</Table.HeaderCell>
                  <Table.HeaderCell>Inherent</Table.HeaderCell>
                  <Table.HeaderCell>Residual</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell align="right">Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visible.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell>
                      <Link href={`/m/risk/register/${r.id}`}>{r.ref}</Link>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{r.title}</div>
                      {r.category && (
                        <span className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
                          {r.category}
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell>{r.ownerName ?? <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>
                      <ScoreBadge l={r.inherentLikelihood} i={r.inherentImpact} m={methodology} />
                    </Table.Cell>
                    <Table.Cell>
                      <ScoreBadge l={r.residualLikelihood} i={r.residualImpact} m={methodology} />
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={r.status === "accepted" ? "success" : r.status === "closed" ? "neutral" : "info"} dot>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <Link href={`/m/risk/register/${r.id}`}>
                          <Button size="sm" variant="ghost">
                            Open
                          </Button>
                        </Link>
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => setEditorTarget(r)}>
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(r)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
      <RiskEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        methodology={methodology}
        owners={owners}
        orgUnits={orgUnits}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}

export function LevelSelect({
  id,
  name,
  levels,
  defaultValue,
}: {
  id: string;
  name: string;
  levels: { label: string }[];
  defaultValue?: number | null;
}) {
  return (
    <Select id={id} name={name} defaultValue={String(defaultValue ?? 1)}>
      {levels.map((level, i) => (
        <option key={i} value={i + 1}>
          {i + 1} — {level.label}
        </option>
      ))}
    </Select>
  );
}

function RiskEditorModal({
  target,
  methodology,
  owners,
  orgUnits,
  onClose,
}: {
  target: RiskRow | "new" | null;
  methodology: Methodology;
  owners: Option[];
  orgUnits: Option[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const risk = isNew || target === null ? null : target;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRisk, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={target !== null} onClose={onClose} title={isNew ? "New risk" : `Edit — ${risk?.ref}`} size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="riskId" value={risk?.id ?? ""} />}
            <label htmlFor="risk-title">Title</label>
            <Input id="risk-title" name="title" defaultValue={risk?.title} required placeholder="Loss of customer database" />
            <label htmlFor="risk-desc">Description</label>
            <Textarea id="risk-desc" name="description" defaultValue={risk?.description} rows={2} />
            <label htmlFor="risk-category">Category</label>
            <Input id="risk-category" name="category" defaultValue={risk?.category} placeholder="Cyber / Operational / Compliance…" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-grid">
                <label htmlFor="risk-likelihood">Inherent likelihood</label>
                <LevelSelect id="risk-likelihood" name="inherentLikelihood" levels={methodology.likelihood} defaultValue={risk?.inherentLikelihood} />
              </div>
              <div className="form-grid">
                <label htmlFor="risk-impact">Inherent impact</label>
                <LevelSelect id="risk-impact" name="inherentImpact" levels={methodology.impact} defaultValue={risk?.inherentImpact} />
              </div>
            </div>
            <label htmlFor="risk-owner">Owner</label>
            <Select id="risk-owner" name="ownerUserId" defaultValue={risk?.ownerUserId ?? ""}>
              <option value="">— none —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            <label htmlFor="risk-org">Org unit</label>
            <Select id="risk-org" name="orgUnitId" defaultValue={risk?.orgUnitId ?? ""}>
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
            {isNew ? "Create risk" : "Save"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
