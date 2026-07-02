"use client";

import Link from "next/link";
import { Badge, Card, Stat, Table } from "@unisentinel/ui";
import type { RiskRow } from "@/modules/risk/queries";
import { BAND_LABEL, bandFor, bandTone, riskScore, type Methodology } from "@/modules/risk/methodology";

export function RiskOverviewClient({ risks, methodology }: { risks: RiskRow[]; methodology: Methodology }) {
  const withScore = risks.map((r) => {
    const score = riskScore(r.inherentLikelihood, r.inherentImpact);
    return { ...r, score, band: bandFor(score, methodology) };
  });
  const open = withScore.filter((r) => r.status !== "closed");
  const byBand = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of open) byBand[r.band]++;
  const top = [...open].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Risk Management</h1>
          <p>
            {methodology.likelihood.length}×{methodology.impact.length} methodology · {open.length} open risk
            {open.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--us-space-4)" }}>
        <Stat label="Critical" value={String(byBand.critical)} />
        <Stat label="High" value={String(byBand.high)} />
        <Stat label="Medium" value={String(byBand.medium)} />
        <Stat label="Low" value={String(byBand.low)} />
        <Stat label="Accepted" value={String(withScore.filter((r) => r.status === "accepted").length)} />
      </div>
      <Card>
        <Card.Header>
          <Card.Title subtitle="Highest inherent scores first">Top risks</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table hoverable>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Ref</Table.HeaderCell>
                <Table.HeaderCell>Risk</Table.HeaderCell>
                <Table.HeaderCell>Score</Table.HeaderCell>
                <Table.HeaderCell>Band</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {top.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <Link href={`/m/risk/register/${r.id}`}>{r.ref}</Link>
                  </Table.Cell>
                  <Table.Cell>{r.title}</Table.Cell>
                  <Table.Cell>{r.score}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={bandTone[r.band]}>{BAND_LABEL[r.band]}</Badge>
                  </Table.Cell>
                  <Table.Cell>{r.status.replace("_", " ")}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
