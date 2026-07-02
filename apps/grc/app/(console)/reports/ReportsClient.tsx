"use client";

import Link from "next/link";
import { Badge, Card } from "@unisentinel/ui";

interface ReportCard {
  key: string;
  title: string;
  description: string;
  moduleName: string;
}

export function ReportsClient({ reports }: { reports: ReportCard[] }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>Parameterized, branded PDF exports. Reports follow your module licenses and permissions.</p>
        </div>
      </div>
      {reports.length === 0 ? (
        <Card>
          <Card.Body>
            <p className="muted" style={{ margin: 0 }}>
              No reports available — license a module (or ask for the matching view permission) and its
              reports appear here.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--us-space-4)",
          }}
        >
          {reports.map((r) => (
            <Link key={r.key} href={`/reports/${r.key}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card interactive>
                <Card.Body>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <strong style={{ color: "var(--us-color-heading)" }}>{r.title}</strong>
                    <Badge tone="brand">{r.moduleName}</Badge>
                  </div>
                  <p className="muted" style={{ margin: "var(--us-space-2) 0 0", fontSize: "var(--us-text-sm)" }}>
                    {r.description}
                  </p>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
