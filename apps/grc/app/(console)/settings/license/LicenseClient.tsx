"use client";

import { useActionState } from "react";
import { Alert, Badge, Button, Card, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { uploadLicense } from "@/platform/modules/license-actions";

interface ModuleRow {
  key: string;
  name: string;
  plannedPhase: number;
  status: "active" | "expired" | "unlicensed";
  seats: number | null;
  expiresAt: string | null;
}

interface CurrentLicense {
  licenseId: string;
  customer: string;
  modules: { key: string; seats?: number }[];
  issuedAt: string;
  expiresAt: string;
}

const STATUS_TONE = { active: "success", expired: "danger", unlicensed: "neutral" } as const;

export function LicenseClient({ current, modules }: { current: CurrentLicense | null; modules: ModuleRow[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadLicense, {});
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>License</h1>
          <p>
            Modules activate from a signed license file — verified offline, nothing leaves this
            instance. Uploading a new license replaces the previous one.
          </p>
        </div>
      </div>

      <Card>
        <Card.Header>
          <Card.Title subtitle={current ? `License ${current.licenseId} · ${current.customer}` : "No license applied yet"}>
            Modules
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Table hoverable>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Module</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Seats</Table.HeaderCell>
                <Table.HeaderCell>Expires</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {modules.map((m) => (
                <Table.Row key={m.key}>
                  <Table.Cell>
                    {m.name} <span className="muted mono">({m.key})</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={STATUS_TONE[m.status]} dot>
                      {m.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{m.seats ?? "—"}</Table.Cell>
                  <Table.Cell>{m.expiresAt ? m.expiresAt.slice(0, 10) : "—"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title subtitle="Get license files from UniSentinel sales">Upload license</Card.Title>
        </Card.Header>
        <Card.Body>
          <form action={action} className="form-grid" style={{ maxWidth: 480 }}>
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {state.ok && <Alert tone="success">License applied — the app drawer is updated.</Alert>}
            <input type="file" name="license" accept=".license,.txt,application/octet-stream" required />
            <div>
              <Button type="submit" loading={pending}>
                Apply license
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}
