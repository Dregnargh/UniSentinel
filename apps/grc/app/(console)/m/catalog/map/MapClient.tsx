"use client";

import * as React from "react";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@unisentinel/ui";
import { ASSET_TYPE_LABEL, RELATIONSHIP_LABEL } from "@/modules/catalog/format";

interface ServiceNode {
  id: string;
  name: string;
  criticality: string;
}

interface AssetNode {
  id: string;
  name: string;
  type: string;
  classification: string;
}

interface EdgeInput {
  id: string;
  source: string;
  target: string;
  kind?: string;
  classification?: string;
  protocol?: string;
}

const CRIT_COLOR: Record<string, string> = {
  low: "#8aa0b4",
  medium: "#086888",
  high: "#c77d1e",
  critical: "#b3261e",
};

const CLASS_COLOR: Record<string, string> = {
  public: "#8aa0b4",
  internal: "#086888",
  confidential: "#c77d1e",
  restricted: "#b3261e",
};

/**
 * Generated layout (no free-form editor yet, per plan): services in the left
 * column, assets grouped by type in columns to the right. Positions are
 * derived from data, so the map is always current; drag to rearrange within a
 * session (positions aren't persisted yet — saved views come later).
 */
function buildNodes(services: ServiceNode[], assets: AssetNode[]): Node[] {
  const nodes: Node[] = [];
  const GAP_Y = 78;
  const COL_W = 240;

  services.forEach((s, i) => {
    nodes.push({
      id: `service:${s.id}`,
      position: { x: 0, y: i * GAP_Y },
      data: { label: s.name },
      style: {
        border: `2px solid ${CRIT_COLOR[s.criticality] ?? "#086888"}`,
        borderRadius: 10,
        padding: "8px 12px",
        background: "#fff",
        fontWeight: 600,
        width: 180,
      },
    });
  });

  const types = [...new Set(assets.map((a) => a.type))].sort();
  types.forEach((type, col) => {
    const ofType = assets.filter((a) => a.type === type);
    ofType.forEach((a, i) => {
      nodes.push({
        id: `asset:${a.id}`,
        position: { x: (col + 1) * COL_W + 80, y: i * GAP_Y },
        data: { label: `${a.name}\n${ASSET_TYPE_LABEL[type] ?? type}` },
        style: {
          border: "1px solid #cdd9e1",
          borderLeft: `4px solid ${CLASS_COLOR[a.classification] ?? "#8aa0b4"}`,
          borderRadius: 8,
          padding: "6px 10px",
          background: "#fff",
          fontSize: 12,
          whiteSpace: "pre-line",
          width: 170,
        },
      });
    });
  });
  return nodes;
}

export function MapClient({
  services,
  assets,
  relationships,
  flows,
}: {
  services: ServiceNode[];
  assets: AssetNode[];
  relationships: EdgeInput[];
  flows: EdgeInput[];
}) {
  const [mode, setMode] = React.useState<"network" | "flows">("network");
  const nodes = React.useMemo(() => buildNodes(services, assets), [services, assets]);

  const edges: Edge[] = React.useMemo(() => {
    const inputs = mode === "network" ? relationships : flows;
    return inputs.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label:
        mode === "network"
          ? (RELATIONSHIP_LABEL[e.kind ?? ""] ?? e.kind)
          : [e.classification, e.protocol].filter(Boolean).join(" · "),
      animated: mode === "flows",
      style:
        mode === "flows"
          ? { stroke: CLASS_COLOR[e.classification ?? "internal"] ?? "#086888", strokeWidth: 2 }
          : { stroke: "#8aa0b4" },
      labelStyle: { fontSize: 10 },
    }));
  }, [mode, relationships, flows]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Map</h1>
          <p>Generated from your services, assets and connections — always current.</p>
        </div>
        <div className="seg">
          <button type="button" data-active={mode === "network" || undefined} onClick={() => setMode("network")}>
            Network
          </button>
          <button type="button" data-active={mode === "flows" || undefined} onClick={() => setMode("flows")}>
            Data flows
          </button>
        </div>
      </div>
      <Card>
        <Card.Body>
          {nodes.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing to draw yet — add services, assets and connections first.
            </p>
          ) : (
            <div style={{ height: 560 }} data-testid="catalog-map">
              <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
                <Background gap={18} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
