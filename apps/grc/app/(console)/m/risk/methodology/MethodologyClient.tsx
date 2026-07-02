"use client";

import * as React from "react";
import { useActionState } from "react";
import { Alert, Button, Card, Input, Select } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { updateMethodology } from "@/modules/risk/actions";
import type { Methodology } from "@/modules/risk/methodology";

function AxisEditor({
  axis,
  label,
  levels,
  count,
  setCount,
}: {
  axis: "likelihood" | "impact";
  label: string;
  levels: { label: string; description: string }[];
  count: number;
  setCount: (n: number) => void;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle={`${count} levels`}>{label}</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="form-grid">
          <label htmlFor={`${axis}-count`}>Number of levels</label>
          <Select
            id={`${axis}-count`}
            name={`${axis}Count`}
            value={String(count)}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ maxWidth: 120 }}
          >
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </Select>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 180px 1fr", gap: 8, alignItems: "center" }}>
              <span className="muted mono">{i + 1}</span>
              <Input
                name={`${axis}Label${i}`}
                defaultValue={levels[i]?.label ?? ""}
                required
                placeholder={`Level ${i + 1}`}
                aria-label={`${label} level ${i + 1} label`}
              />
              <Input
                name={`${axis}Desc${i}`}
                defaultValue={levels[i]?.description ?? ""}
                placeholder="Description"
                aria-label={`${label} level ${i + 1} description`}
              />
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

export function MethodologyClient({
  methodology,
  inUse,
  canManage,
}: {
  methodology: Methodology;
  inUse: { likelihood: number; impact: number };
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMethodology, {});
  const [lCount, setLCount] = React.useState(methodology.likelihood.length);
  const [iCount, setICount] = React.useState(methodology.impact.length);
  const max = lCount * iCount;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Methodology</h1>
          <p>
            The scoring matrix is configurable from 3×3 up to 5×5 — level labels, descriptions and band
            thresholds are yours to define. Score = likelihood × impact (max {max}).
          </p>
        </div>
      </div>
      {(inUse.likelihood > 0 || inUse.impact > 0) && (
        <Alert tone="info">
          Highest levels currently used by risks: likelihood {inUse.likelihood}, impact {inUse.impact}. The
          scale can't shrink below levels still in use.
        </Alert>
      )}
      {!canManage && <Alert tone="warning">You can view the methodology but not change it.</Alert>}
      <form action={action} className="stack">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.ok && <Alert tone="success">Methodology saved.</Alert>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--us-space-6)" }}>
          <AxisEditor axis="likelihood" label="Likelihood" levels={methodology.likelihood} count={lCount} setCount={setLCount} />
          <AxisEditor axis="impact" label="Impact" levels={methodology.impact} count={iCount} setCount={setICount} />
        </div>
        <Card>
          <Card.Header>
            <Card.Title subtitle={`Scores run 1–${max}; anything above the High threshold is Critical`}>
              Bands
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 200px)", gap: "var(--us-space-4)" }}>
              <div className="form-grid">
                <label htmlFor="band-low">Low ≤</label>
                <Input id="band-low" name="bandLow" type="number" min={1} defaultValue={methodology.bands.low} required />
              </div>
              <div className="form-grid">
                <label htmlFor="band-medium">Medium ≤</label>
                <Input id="band-medium" name="bandMedium" type="number" min={2} defaultValue={methodology.bands.medium} required />
              </div>
              <div className="form-grid">
                <label htmlFor="band-high">High ≤</label>
                <Input id="band-high" name="bandHigh" type="number" min={3} defaultValue={methodology.bands.high} required />
              </div>
            </div>
          </Card.Body>
        </Card>
        {canManage && (
          <div>
            <Button type="submit" loading={pending}>
              Save methodology
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
