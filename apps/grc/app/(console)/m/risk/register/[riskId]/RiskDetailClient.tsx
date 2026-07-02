"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Select, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { RiskRow } from "@/modules/risk/queries";
import {
  acceptRisk,
  addScopeItem,
  addTreatmentAction,
  assessResidual,
  removeScopeItem,
  removeTreatmentAction,
  setRiskStatus,
  setTreatmentStrategy,
  toggleTreatmentAction,
} from "@/modules/risk/actions";
import { BAND_LABEL, bandFor, bandTone, riskScore, type Methodology } from "@/modules/risk/methodology";
import { LevelSelect } from "../RegisterClient";

interface ScopeItem {
  id: string;
  name: string;
  kind: string;
  notes: string;
}

interface TreatmentAction {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
}

interface AssessmentRow {
  id: string;
  kind: string;
  likelihood: number;
  impact: number;
  note: string;
  by: string;
  at: string;
}

function Score({ l, i, m, label }: { l: number | null; i: number | null; m: Methodology; label: string }) {
  if (!l || !i)
    return (
      <div>
        <div className="muted" style={{ fontSize: "var(--us-text-xs)", textTransform: "uppercase" }}>{label}</div>
        <span className="muted">not assessed</span>
      </div>
    );
  const score = riskScore(l, i);
  const band = bandFor(score, m);
  return (
    <div>
      <div className="muted" style={{ fontSize: "var(--us-text-xs)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        <span style={{ fontSize: "var(--us-text-2xl)", fontWeight: 700, color: "var(--us-color-heading)" }}>{score}</span>
        <Badge tone={bandTone[band]}>{BAND_LABEL[band]}</Badge>
        <span className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
          {m.likelihood[l - 1]?.label} × {m.impact[i - 1]?.label}
        </span>
      </div>
    </div>
  );
}

export function RiskDetailClient({
  risk,
  methodology,
  scope,
  actions,
  assessments,
  can,
}: {
  risk: RiskRow;
  methodology: Methodology;
  scope: ScopeItem[];
  actions: TreatmentAction[];
  assessments: AssessmentRow[];
  can: { manage: boolean; approve: boolean };
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [residualOpen, setResidualOpen] = React.useState(false);

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>
            {risk.ref} — {risk.title}
          </h1>
          <p>
            <Link href="/m/risk/register">← Back to register</Link>
            {risk.category && <> · {risk.category}</>}
            {risk.ownerName && <> · owner {risk.ownerName}</>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge tone={risk.status === "accepted" ? "success" : "info"} dot>
            {risk.status.replace("_", " ")}
          </Badge>
          {can.approve && risk.status !== "accepted" && risk.status !== "closed" && (
            <Button variant="accent" disabled={pending} onClick={() => run(() => acceptRisk(risk.id))}>
              Accept risk
            </Button>
          )}
          {can.manage && risk.status !== "closed" && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => setRiskStatus(risk.id, "closed"))}>
              Close
            </Button>
          )}
        </div>
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {risk.acceptedByName && (
        <Alert tone="success" title={`Accepted by ${risk.acceptedByName}`}>
          {risk.acceptedAt?.replace("T", " ").slice(0, 16)} UTC — acceptance is recorded in the audit trail.
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title subtitle="Inherent vs residual on the workspace methodology">Assessment</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "var(--us-space-6)", alignItems: "center" }}>
            <Score l={risk.inherentLikelihood} i={risk.inherentImpact} m={methodology} label="Inherent" />
            <Score l={risk.residualLikelihood} i={risk.residualImpact} m={methodology} label="Residual" />
            {can.manage && (
              <Button variant="outline" onClick={() => setResidualOpen(true)}>
                Assess residual…
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--us-space-6)" }}>
        <ScopeCard riskId={risk.id} scope={scope} canManage={can.manage} run={run} pending={pending} />
        <TreatmentCard
          risk={risk}
          actions={actions}
          canManage={can.manage}
          run={run}
          pending={pending}
        />
      </div>

      <Card>
        <Card.Header>
          <Card.Title subtitle="Every assessment, newest first">History</Card.Title>
        </Card.Header>
        <Card.Body>
          {assessments.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No assessments recorded.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--us-space-2)" }}>
              {assessments.map((a) => (
                <li key={a.id} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: "var(--us-text-sm)" }}>
                  <Badge tone={a.kind === "inherent" ? "info" : "brand"}>{a.kind}</Badge>
                  <span>
                    {a.likelihood}×{a.impact} = {riskScore(a.likelihood, a.impact)}
                  </span>
                  {a.note && <span className="muted">{a.note}</span>}
                  <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--us-text-xs)" }}>
                    {a.by} · {a.at.replace("T", " ").slice(0, 16)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>

      <ResidualModal
        key={residualOpen ? "open" : "closed"}
        open={residualOpen}
        riskId={risk.id}
        methodology={methodology}
        onClose={() => setResidualOpen(false)}
      />
    </div>
  );
}

function ScopeCard({
  riskId,
  scope,
  canManage,
  run,
  pending,
}: {
  riskId: string;
  scope: ScopeItem[];
  canManage: boolean;
  run: (fn: () => Promise<ActionState>) => void;
  pending: boolean;
}) {
  const [state, action, adding] = useActionState<ActionState, FormData>(addScopeItem, {});
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="What this risk affects (links to the Service Catalog when licensed)">Scope</Card.Title>
      </Card.Header>
      <Card.Body>
        {scope.length === 0 ? (
          <p className="muted" style={{ marginTop: 0 }}>
            Nothing in scope yet.
          </p>
        ) : (
          <ul style={{ margin: "0 0 var(--us-space-4)", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {scope.map((s) => (
              <li key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "var(--us-text-sm)" }}>
                <Badge tone="neutral">{s.kind}</Badge>
                <span>{s.name}</span>
                {canManage && (
                  <button
                    type="button"
                    className="muted"
                    style={{ marginLeft: "auto", border: 0, background: "none", cursor: "pointer" }}
                    disabled={pending}
                    onClick={() => run(() => removeScopeItem(s.id))}
                    aria-label={`Remove ${s.name}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <form action={action} className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="riskId" value={riskId} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input name="name" placeholder="Customer database" required aria-label="Scope item name" />
              <Select name="kind" defaultValue="asset" aria-label="Scope item kind" style={{ maxWidth: 130 }}>
                <option value="service">service</option>
                <option value="asset">asset</option>
                <option value="process">process</option>
                <option value="other">other</option>
              </Select>
              <Button type="submit" size="sm" variant="outline" loading={adding}>
                Add
              </Button>
            </div>
          </form>
        )}
      </Card.Body>
    </Card>
  );
}

function TreatmentCard({
  risk,
  actions,
  canManage,
  run,
  pending,
}: {
  risk: RiskRow;
  actions: TreatmentAction[];
  canManage: boolean;
  run: (fn: () => Promise<ActionState>) => void;
  pending: boolean;
}) {
  const [stratState, stratAction, stratPending] = useActionState<ActionState, FormData>(setTreatmentStrategy, {});
  const [addState, addAction, adding] = useActionState<ActionState, FormData>(addTreatmentAction, {});
  const done = actions.filter((a) => a.done).length;

  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle={`Treatment plan (${done}/${actions.length} actions done — becomes Tasks when licensed)`}>
          Treatment
        </Card.Title>
      </Card.Header>
      <Card.Body>
        {canManage && (
          <form action={stratAction} className="form-grid" style={{ marginBottom: "var(--us-space-4)" }}>
            {stratState.error && <Alert tone="danger">{stratState.error}</Alert>}
            <input type="hidden" name="riskId" value={risk.id} />
            <div style={{ display: "flex", gap: 8 }}>
              <Select name="strategy" defaultValue={risk.treatmentStrategy ?? "mitigate"} aria-label="Treatment strategy">
                <option value="mitigate">Mitigate</option>
                <option value="accept">Accept</option>
                <option value="transfer">Transfer</option>
                <option value="avoid">Avoid</option>
              </Select>
              <Button type="submit" size="sm" variant="outline" loading={stratPending}>
                Set strategy
              </Button>
            </div>
            <Textarea name="notes" defaultValue={risk.treatmentNotes} rows={2} placeholder="Treatment notes…" />
          </form>
        )}
        {!canManage && risk.treatmentStrategy && (
          <p style={{ marginTop: 0 }}>
            <Badge tone="info">{risk.treatmentStrategy}</Badge> {risk.treatmentNotes}
          </p>
        )}
        {actions.length > 0 && (
          <ul style={{ margin: "0 0 var(--us-space-4)", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {actions.map((a) => (
              <li key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "var(--us-text-sm)" }}>
                <Checkbox
                  checked={a.done}
                  disabled={!canManage || pending}
                  onChange={(e) => run(() => toggleTreatmentAction(a.id, e.target.checked))}
                  label={a.title}
                />
                {a.dueDate && (
                  <span className="muted" style={{ fontSize: "var(--us-text-xs)" }}>
                    due {a.dueDate}
                  </span>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="muted"
                    style={{ marginLeft: "auto", border: 0, background: "none", cursor: "pointer" }}
                    disabled={pending}
                    onClick={() => run(() => removeTreatmentAction(a.id))}
                    aria-label={`Remove ${a.title}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <form action={addAction} className="form-grid">
            {addState.error && <Alert tone="danger">{addState.error}</Alert>}
            <input type="hidden" name="riskId" value={risk.id} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input name="title" placeholder="Enable DB encryption at rest" required aria-label="Treatment action title" />
              <Input name="dueDate" type="date" aria-label="Treatment action due date" style={{ maxWidth: 160 }} />
              <Button type="submit" size="sm" variant="outline" loading={adding}>
                Add
              </Button>
            </div>
          </form>
        )}
      </Card.Body>
    </Card>
  );
}

function ResidualModal({
  open,
  riskId,
  methodology,
  onClose,
}: {
  open: boolean;
  riskId: string;
  methodology: Methodology;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(assessResidual, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={open} onClose={onClose} title="Assess residual risk" size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <input type="hidden" name="riskId" value={riskId} />
            <label htmlFor="res-likelihood">Residual likelihood</label>
            <LevelSelect id="res-likelihood" name="likelihood" levels={methodology.likelihood} />
            <label htmlFor="res-impact">Residual impact</label>
            <LevelSelect id="res-impact" name="impact" levels={methodology.impact} />
            <label htmlFor="res-note">Note</label>
            <Input id="res-note" name="note" placeholder="After controls X and Y" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            Record assessment
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
