"use client";

import { Badge, Card, Stat } from "@unisentinel/ui";

interface RecentEvent {
  id: string;
  action: string;
  summary: string;
  at: string;
}

export function HomeClient(props: {
  workspaceName: string;
  email: string;
  version: string;
  ready: boolean;
  workerHeartbeat: string | null;
  memberCount: number;
  orgUnitCount: number;
  auditTotal: number;
  recent: RecentEvent[];
}) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{props.workspaceName}</h1>
          <p>
            Platform v{props.version} · signed in as {props.email}
          </p>
        </div>
        <Badge tone={props.ready ? "success" : "warning"} dot>
          {props.ready ? "instance healthy" : "instance degraded"}
        </Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--us-space-4)" }}>
        <Stat label="Members" value={String(props.memberCount)} />
        <Stat label="Org units" value={String(props.orgUnitCount)} />
        <Stat label="Audit events" value={String(props.auditTotal)} />
        <Stat label="Worker" value={props.workerHeartbeat ? "running" : "no heartbeat"} />
      </div>

      <Card>
        <Card.Header>
          <Card.Title subtitle="Latest activity in this workspace">Recent activity</Card.Title>
        </Card.Header>
        <Card.Body>
          {props.recent.length === 0 ? (
            <p className="muted">Nothing yet.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--us-space-3)" }}>
              {props.recent.map((e) => (
                <li key={e.id} style={{ display: "flex", gap: "var(--us-space-3)", alignItems: "baseline" }}>
                  <Badge tone="neutral">{e.action}</Badge>
                  <span style={{ flex: 1 }}>{e.summary}</span>
                  <span className="muted" style={{ fontSize: "var(--us-text-xs)", whiteSpace: "nowrap" }}>
                    {e.at.replace("T", " ").slice(0, 16)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <p className="muted" style={{ margin: 0 }}>
            Phase 1 — identity &amp; tenancy. The module framework, licensing and the app drawer arrive in
            upcoming phases; dashboards become configurable once modules exist.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
