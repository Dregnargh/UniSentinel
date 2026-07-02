"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import { Alert, Badge, Button, Card, Select, Stat, Table } from "@unisentinel/ui";
import type { WidgetData } from "@/modules/types";
import type { ActionState } from "@/platform/auth/actions";
import {
  addDashboardWidget,
  moveDashboardWidget,
  removeDashboardWidget,
} from "@/platform/dashboards/actions";

export interface WidgetView {
  id: string;
  widgetKey: string;
  title: string;
  span: 1 | 2 | 3;
  data: WidgetData;
}

export interface AvailableWidget {
  key: string;
  title: string;
  moduleName: string;
}

// Same band palette as the full heatmap page.
const CELL_BG: Record<string, string> = {
  low: "color-mix(in srgb, #8aa0b4 22%, white)",
  medium: "color-mix(in srgb, #086888 22%, white)",
  high: "color-mix(in srgb, #c77d1e 30%, white)",
  critical: "color-mix(in srgb, #b3261e 32%, white)",
};

export function DashboardSection({
  widgets,
  available,
}: {
  widgets: WidgetView[];
  available: AvailableWidget[];
}) {
  const [customize, setCustomize] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pickerRef = React.useRef<HTMLSelectElement>(null);

  const shown = new Set(widgets.map((w) => w.widgetKey));
  const addable = available.filter((w) => !shown.has(w.key));

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
    });

  return (
    <section aria-label="My dashboard">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--us-space-3)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--us-text-lg)" }}>My dashboard</h2>
        {(widgets.length > 0 || addable.length > 0) && (
          <Button size="sm" variant={customize ? "primary" : "outline"} onClick={() => setCustomize((v) => !v)}>
            {customize ? "Done" : "Customize"}
          </Button>
        )}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {customize && (
        <Card variant="subtle" style={{ marginBottom: "var(--us-space-4)" }}>
          <Card.Body>
            {addable.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Every widget you can see is already on the dashboard.
              </p>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Select ref={pickerRef} defaultValue={addable[0]?.key} aria-label="Widget to add" style={{ maxWidth: 360 }}>
                  {addable.map((w) => (
                    <option key={w.key} value={w.key}>
                      {w.title} ({w.moduleName})
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    const key = pickerRef.current?.value;
                    if (key) run(() => addDashboardWidget(key));
                  }}
                >
                  Add widget
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
      {widgets.length === 0 ? (
        <Card>
          <Card.Body>
            <p className="muted" style={{ margin: 0 }}>
              No widgets yet. {addable.length > 0 ? "Hit Customize to add some." : "License modules and their widgets appear here."}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div
          data-testid="dashboard-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--us-space-4)" }}
        >
          {widgets.map((w, index) => (
            <Card key={w.id} style={{ gridColumn: `span ${w.span}` }} data-widget={w.widgetKey}>
              <Card.Header>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <Card.Title>{w.title}</Card.Title>
                  {customize && (
                    <div style={{ display: "inline-flex", gap: 4 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending || index === 0}
                        onClick={() => run(() => moveDashboardWidget(w.id, -1))}
                        aria-label={`Move ${w.title} earlier`}
                      >
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending || index === widgets.length - 1}
                        onClick={() => run(() => moveDashboardWidget(w.id, 1))}
                        aria-label={`Move ${w.title} later`}
                      >
                        →
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => run(() => removeDashboardWidget(w.id))}
                        aria-label={`Remove ${w.title}`}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <Widget data={w.data} />
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Widget({ data }: { data: WidgetData }) {
  if (data.kind === "stats") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(data.stats.length, 4)}, 1fr)`, gap: "var(--us-space-3)" }}>
        {data.stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    );
  }

  if (data.kind === "list") {
    if (data.items.length === 0)
      return (
        <p className="muted" style={{ margin: 0 }}>
          {data.empty}
        </p>
      );
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {data.items.map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: "var(--us-text-sm)" }}>
            {item.badge && <Badge tone={item.badgeTone ?? "neutral"}>{item.badge}</Badge>}
            {item.href ? <Link href={item.href}>{item.title}</Link> : <span>{item.title}</span>}
            {item.meta && (
              <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--us-text-xs)", whiteSpace: "nowrap" }}>
                {item.meta}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (data.kind === "table") {
    if (data.rows.length === 0)
      return (
        <p className="muted" style={{ margin: 0 }}>
          {data.empty}
        </p>
      );
    return (
      <Table>
        <Table.Head>
          <Table.Row>
            {data.columns.map((c) => (
              <Table.HeaderCell key={c}>{c}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {data.rows.map((row, i) => (
            <Table.Row key={i}>
              {row.cells.map((cell, j) => (
                <Table.Cell key={j}>{j === 0 && row.href ? <Link href={row.href}>{cell}</Link> : cell}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  // Mini heatmap: likelihood rows (high at top), impact columns.
  const rows = [...data.cells].reverse();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${data.cells[0]?.length ?? 1}, 1fr)`,
        gap: 3,
      }}
    >
      {rows.flatMap((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              background: CELL_BG[cell.band] ?? CELL_BG.low,
              border: "1px solid var(--us-color-border)",
              borderRadius: 4,
              minHeight: 30,
              display: "grid",
              placeItems: "center",
              fontSize: "var(--us-text-sm)",
              fontWeight: cell.count > 0 ? 700 : 400,
              color: cell.count > 0 ? "var(--us-color-heading)" : "var(--us-color-muted, #8894a0)",
            }}
          >
            {cell.count > 0 ? cell.count : ""}
          </div>
        )),
      )}
    </div>
  );
}
