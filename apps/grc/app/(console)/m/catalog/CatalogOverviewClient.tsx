"use client";

import Link from "next/link";
import { Badge, Card, Stat } from "@unisentinel/ui";
import type { CatalogStats } from "@/modules/catalog/queries";
import { ASSET_TYPE_LABEL } from "@/modules/catalog/format";

export function CatalogOverviewClient({ stats }: { stats: CatalogStats }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Service Catalog</h1>
          <p>Company context: services, assets, and how they connect.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "var(--us-space-4)" }}>
        <Stat label="Services" value={String(stats.services)} />
        <Stat label="Assets" value={String(stats.assets)} />
        <Stat label="Connections" value={String(stats.relationships)} />
        <Stat label="Data flows" value={String(stats.dataFlows)} />
      </div>

      <Card>
        <Card.Header>
          <Card.Title subtitle="Inventory composition">Assets by type</Card.Title>
        </Card.Header>
        <Card.Body>
          {stats.assets === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No assets yet — <Link href="/m/catalog/assets">add your first asset</Link> or import a CSV.
            </p>
          ) : (
            <div style={{ display: "flex", gap: "var(--us-space-2)", flexWrap: "wrap" }}>
              {Object.entries(stats.assetsByType).map(([type, count]) => (
                <Badge key={type} tone="info">
                  {ASSET_TYPE_LABEL[type] ?? type}: {count}
                </Badge>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <p className="muted" style={{ margin: 0 }}>
            Other modules build on this catalog: risk scoping, assessment targeting and audit
            universes all reference these services and assets once those modules are licensed.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
