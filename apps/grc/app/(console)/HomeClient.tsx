"use client";

import { Badge, Card, Stat } from "@unisentinel/ui";
import { DashboardSection, type AvailableWidget, type WidgetView } from "./DashboardSection";

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
  /** null = viewer lacks audit permission; the feed is hidden entirely. */
  audit: { total: number; entries: RecentEvent[] } | null;
  dashboard: { widgets: WidgetView[]; available: AvailableWidget[] };
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

      <DashboardSection widgets={props.dashboard.widgets} available={props.dashboard.available} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--us-space-4)" }}>
        <Stat label="Members" value={String(props.memberCount)} />
        <Stat label="Org units" value={String(props.orgUnitCount)} />
        {props.audit && <Stat label="Audit events" value={String(props.audit.total)} />}
        <Stat label="Worker" value={props.workerHeartbeat ? "running" : "no heartbeat"} />
      </div>

      {props.audit && (
        <Card>
          <Card.Header>
            <Card.Title subtitle="Latest activity in this workspace">Recent activity</Card.Title>
          </Card.Header>
          <Card.Body>
            {props.audit.entries.length === 0 ? (
              <p className="muted">Nothing yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--us-space-3)" }}>
                {props.audit.entries.map((e) => (
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
      )}

    </div>
  );
}
