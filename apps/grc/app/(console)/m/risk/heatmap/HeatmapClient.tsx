"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Card } from "@unisentinel/ui";
import type { RiskRow } from "@/modules/risk/queries";
import { BAND_LABEL, bandFor, bandTone, riskScore, type Methodology } from "@/modules/risk/methodology";

const CELL_BG: Record<string, string> = {
  low: "color-mix(in srgb, #8aa0b4 22%, white)",
  medium: "color-mix(in srgb, #086888 22%, white)",
  high: "color-mix(in srgb, #c77d1e 30%, white)",
  critical: "color-mix(in srgb, #b3261e 32%, white)",
};

export function HeatmapClient({ risks, methodology }: { risks: RiskRow[]; methodology: Methodology }) {
  const [mode, setMode] = React.useState<"inherent" | "residual">("inherent");
  const [selected, setSelected] = React.useState<{ l: number; i: number } | null>(null);

  const positioned = risks
    .filter((r) => r.status !== "closed")
    .map((r) => ({
      ...r,
      l: mode === "inherent" ? r.inherentLikelihood : r.residualLikelihood,
      i: mode === "inherent" ? r.inherentImpact : r.residualImpact,
    }))
    .filter((r): r is typeof r & { l: number; i: number } => r.l !== null && r.i !== null);

  const inCell = (l: number, i: number) => positioned.filter((r) => r.l === l && r.i === i);
  const selectedRisks = selected ? inCell(selected.l, selected.i) : positioned;
  const L = methodology.likelihood.length;
  const I = methodology.impact.length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Heatmap</h1>
          <p>
            {L}×{I} matrix · {positioned.length} plotted risk{positioned.length === 1 ? "" : "s"} — click a cell to
            filter.
          </p>
        </div>
        <div className="seg">
          <button type="button" data-active={mode === "inherent" || undefined} onClick={() => { setMode("inherent"); setSelected(null); }}>
            Inherent
          </button>
          <button type="button" data-active={mode === "residual" || undefined} onClick={() => { setMode("residual"); setSelected(null); }}>
            Residual
          </button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <div className="heatmap" data-testid="risk-heatmap" style={{ gridTemplateColumns: `120px repeat(${I}, 1fr)` }}>
            {/* rows: likelihood descending */}
            {Array.from({ length: L }, (_, row) => {
              const l = L - row;
              return (
                <React.Fragment key={l}>
                  <div className="heatmap__axis">
                    {l} — {methodology.likelihood[l - 1]?.label}
                  </div>
                  {Array.from({ length: I }, (_, col) => {
                    const i = col + 1;
                    const score = riskScore(l, i);
                    const band = bandFor(score, methodology);
                    const cell = inCell(l, i);
                    const isSelected = selected?.l === l && selected?.i === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        className="heatmap__cell"
                        data-selected={isSelected || undefined}
                        style={{ background: CELL_BG[band] }}
                        onClick={() => setSelected(isSelected ? null : { l, i })}
                        aria-label={`Likelihood ${l}, impact ${i}: ${cell.length} risks`}
                      >
                        <span className="heatmap__count">{cell.length || ""}</span>
                        <span className="heatmap__score">{score}</span>
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
            <div />
            {Array.from({ length: I }, (_, col) => (
              <div key={col} className="heatmap__axis heatmap__axis--x">
                {col + 1} — {methodology.impact[col]?.label}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title subtitle={selected ? `Cell ${selected.l}×${selected.i}` : "All plotted risks"}>Risks</Card.Title>
        </Card.Header>
        <Card.Body>
          {selectedRisks.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing here.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {selectedRisks.map((r) => {
                const band = bandFor(riskScore(r.l, r.i), methodology);
                return (
                  <li key={r.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link href={`/m/risk/register/${r.id}`}>{r.ref}</Link>
                    <span style={{ flex: 1 }}>{r.title}</span>
                    <Badge tone={bandTone[band]}>{BAND_LABEL[band]}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
