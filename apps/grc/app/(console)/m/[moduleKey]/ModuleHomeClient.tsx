"use client";

import { Alert, Badge, Card } from "@unisentinel/ui";
import { ModuleIcon } from "@/components/shell/moduleIcons";

export function ModuleHomeClient(props: {
  name: string;
  description: string;
  icon: string;
  plannedPhase: number;
  permissionCount: number;
  entityTypes: string[];
}) {
  return (
    <div className="stack">
      <div className="page-head">
        <div style={{ display: "flex", gap: "var(--us-space-4)", alignItems: "center" }}>
          <span className="module-hero-icon">
            <ModuleIcon name={props.icon} />
          </span>
          <div>
            <h1>{props.name}</h1>
            <p>{props.description}</p>
          </div>
        </div>
        <Badge tone="success" dot>
          licensed
        </Badge>
      </div>
      <Alert tone="info" title={`This module's screens arrive in Phase ${props.plannedPhase}`}>
        The module is licensed and active: its {props.permissionCount} permissions are available in
        the role builder now, so you can prepare roles ahead of the rollout.
      </Alert>
      <Card>
        <Card.Body>
          <p className="muted" style={{ margin: 0 }}>
            Entity types this module will own:{" "}
            {props.entityTypes.map((t) => (
              <Badge key={t} tone="neutral" style={{ marginRight: 6 }}>
                {t}
              </Badge>
            ))}
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
