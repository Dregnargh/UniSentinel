"use client";

import Link from "next/link";
import { Badge, Card, Select, Table } from "@unisentinel/ui";

export interface AuditRow {
  id: string;
  actorName: string;
  action: string;
  summary: string;
  at: string;
}

function toneFor(action: string): "danger" | "warning" | "success" | "neutral" {
  if (action.includes("delete") || action.includes("lockout")) return "danger";
  if (action.includes("disable") || action.includes("deactivat") || action.includes("reset")) return "warning";
  if (action.includes("create") || action.includes("setup") || action.includes("enable")) return "success";
  return "neutral";
}

export function AuditLogClient(props: {
  entries: AuditRow[];
  total: number;
  page: number;
  pageCount: number;
  entityType?: string;
  entityTypes: string[];
}) {
  const href = (p: number) =>
    `/settings/audit-log?page=${p}${props.entityType ? `&entityType=${encodeURIComponent(props.entityType)}` : ""}`;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p>
            Append-only record of every change in this workspace — {props.total} event
            {props.total === 1 ? "" : "s"}. Entries can never be edited or deleted.
          </p>
        </div>
      </div>

      <form method="GET" style={{ display: "flex", gap: "var(--us-space-2)", alignItems: "center", maxWidth: 380 }}>
        <Select name="entityType" defaultValue={props.entityType ?? ""} size="sm">
          <option value="">All entities</option>
          {props.entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          style={{
            border: "1px solid var(--us-color-border)",
            borderRadius: 8,
            padding: "6px 12px",
            background: "#fff",
            cursor: "pointer",
            font: "inherit",
            fontSize: "var(--us-text-sm)",
          }}
        >
          Apply
        </button>
      </form>

      <Card>
        <Card.Body>
          <Table hoverable>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>When (UTC)</Table.HeaderCell>
                <Table.HeaderCell>Actor</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
                <Table.HeaderCell>Summary</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {props.entries.map((e) => (
                <Table.Row key={e.id}>
                  <Table.Cell style={{ whiteSpace: "nowrap" }}>{e.at.replace("T", " ").slice(0, 19)}</Table.Cell>
                  <Table.Cell style={{ whiteSpace: "nowrap" }}>{e.actorName}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={toneFor(e.action)}>{e.action}</Badge>
                  </Table.Cell>
                  <Table.Cell>{e.summary}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {props.pageCount > 1 && (
            <div
              style={{
                display: "flex",
                gap: "var(--us-space-3)",
                marginTop: "var(--us-space-4)",
                alignItems: "center",
              }}
            >
              {props.page > 1 && <Link href={href(props.page - 1)}>← Newer</Link>}
              <span className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
                Page {props.page} of {props.pageCount}
              </span>
              {props.page < props.pageCount && <Link href={href(props.page + 1)}>Older →</Link>}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
