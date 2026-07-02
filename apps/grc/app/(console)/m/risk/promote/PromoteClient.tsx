"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, Badge, Button, Card, Select } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { promoteScope, promoteTreatments } from "@/modules/risk/actions";
import { catalogKindFor } from "@/modules/risk/promotion";

// Serialized shapes from modules/risk/integrations.ts (kept local — this file
// must not import server-only modules).
interface ScopeItem {
  id: string;
  riskId: string;
  riskRef: string;
  riskTitle: string;
  name: string;
  kind: string;
  suggestion: { type: string; id: string; name: string } | null;
}

interface Treatment {
  id: string;
  riskId: string;
  riskRef: string;
  riskTitle: string;
  title: string;
  done: boolean;
  dueDate: string | null;
}

interface Candidate {
  type: string;
  id: string;
  name: string;
  detail: string;
}

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px 1fr 340px",
  gap: "var(--us-space-3)",
  alignItems: "center",
  fontSize: "var(--us-text-sm)",
};

export function PromoteClient({
  catalogLicensed,
  tasksLicensed,
  scopeItems,
  treatments,
  candidates,
}: {
  catalogLicensed: boolean;
  tasksLicensed: boolean;
  scopeItems: ScopeItem[];
  treatments: Treatment[];
  candidates: Candidate[];
}) {
  // Action state lives up here: the sections unmount once their items are
  // promoted, and the success confirmation must outlive them.
  const [scopeState, scopeAction, scopePending] = useActionState<ActionState, FormData>(promoteScope, {});
  const [treatState, treatAction, treatPending] = useActionState<ActionState, FormData>(promoteTreatments, {});
  const nothingLeft =
    (!catalogLicensed || scopeItems.length === 0) && (!tasksLicensed || treatments.length === 0);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Promote local risk data</h1>
          <p>
            <Link href="/m/risk/register">← Back to register</Link> · Move standalone fallback data into the
            modules you now license. Nothing changes until you confirm each section.
          </p>
        </div>
      </div>

      {scopeState.ok && <Alert tone="success">Scope promotion complete.</Alert>}
      {treatState.ok && <Alert tone="success">Treatment promotion complete.</Alert>}

      {nothingLeft ? (
        <Card>
          <Card.Body>
            <p style={{ margin: 0 }}>
              Nothing left to promote — all local risk data lives in the licensed modules. 🎉
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {catalogLicensed && scopeItems.length > 0 && (
            <ScopeSection
              items={scopeItems}
              candidates={candidates}
              state={scopeState}
              action={scopeAction}
              pending={scopePending}
            />
          )}
          {tasksLicensed && treatments.length > 0 && (
            <TreatmentSection items={treatments} state={treatState} action={treatAction} pending={treatPending} />
          )}
        </>
      )}
    </div>
  );
}

function ScopeSection({
  items,
  candidates,
  state,
  action,
  pending,
}: {
  items: ScopeItem[];
  candidates: Candidate[];
  state: ActionState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="Each local scope item can link to an existing catalog entity or create a new one">
          Scope items → Service Catalog
        </Card.Title>
      </Card.Header>
      <form action={action}>
        <Card.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {items.map((item) => (
              <div key={item.id} style={rowStyle}>
                <Badge tone="neutral">{item.riskRef}</Badge>
                <span>
                  {item.name} <span className="muted">({item.kind})</span>
                </span>
                <Select
                  name={`decision_${item.id}`}
                  defaultValue={item.suggestion ? `link|${item.suggestion.type}|${item.suggestion.id}` : "create"}
                  aria-label={`Decision for ${item.name}`}
                >
                  {item.suggestion && (
                    <option value={`link|${item.suggestion.type}|${item.suggestion.id}`}>
                      Link to existing “{item.suggestion.name}” (name match)
                    </option>
                  )}
                  <option value="create">
                    Create new {catalogKindFor(item.kind)} “{item.name}”
                  </option>
                  {candidates
                    .filter((c) => !(item.suggestion && c.type === item.suggestion.type && c.id === item.suggestion.id))
                    .map((c) => (
                      <option key={`${c.type}:${c.id}`} value={`link|${c.type}|${c.id}`}>
                        Link to “{c.name}” ({c.detail})
                      </option>
                    ))}
                  <option value="skip">Skip for now</option>
                </Select>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <Button type="submit" loading={pending}>
            Promote scope items
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}

function TreatmentSection({
  items,
  state,
  action,
  pending,
}: {
  items: Treatment[];
  state: ActionState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="Each local treatment action becomes a real task (origin: this risk); completed items stay completed">
          Treatment actions → Tasks &amp; Activities
        </Card.Title>
      </Card.Header>
      <form action={action}>
        <Card.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {items.map((item) => (
              <div key={item.id} style={rowStyle}>
                <Badge tone="neutral">{item.riskRef}</Badge>
                <span>
                  {item.title}
                  {item.done && (
                    <>
                      {" "}
                      <Badge tone="success">done</Badge>
                    </>
                  )}
                  {item.dueDate && (
                    <span className="muted" style={{ fontSize: "var(--us-text-xs)" }}>
                      {" "}
                      · due {item.dueDate}
                    </span>
                  )}
                </span>
                <Select name={`decision_${item.id}`} defaultValue="task" aria-label={`Decision for ${item.title}`}>
                  <option value="task">Create task{item.done ? " (completed)" : ""}</option>
                  <option value="skip">Skip for now</option>
                </Select>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <Button type="submit" loading={pending}>
            Promote treatment actions
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}
