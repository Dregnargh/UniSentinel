import { Alert, Badge, Card } from "@unisentinel/ui";
import { APP_VERSION } from "@/platform/version";
import { getReadiness } from "@/platform/readiness";

export const dynamic = "force-dynamic";

export default async function ShellPage() {
  const readiness = await getReadiness();
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--us-space-16) var(--us-space-4)" }}>
      <Card>
        <Card.Header>
          <Card.Title subtitle={`Platform shell · v${APP_VERSION}`}>UniSentinel GRC</Card.Title>
        </Card.Header>
        <Card.Body>
          {readiness.ready ? (
            <Alert tone="success" title="Instance ready">
              Database connected, {readiness.migrations} migration{readiness.migrations === 1 ? "" : "s"} applied.
            </Alert>
          ) : (
            <Alert tone="warning" title="Instance not ready">
              {readiness.reason}
            </Alert>
          )}
          <div style={{ display: "flex", gap: "var(--us-space-2)", marginTop: "var(--us-space-4)", flexWrap: "wrap" }}>
            <Badge tone={readiness.ready ? "success" : "warning"} dot>
              database
            </Badge>
            <Badge tone={readiness.workerHeartbeat ? "success" : "neutral"} dot>
              worker{readiness.workerHeartbeat ? "" : " (no heartbeat yet)"}
            </Badge>
          </div>
        </Card.Body>
        <Card.Footer>
          Phase 0 skeleton — identity, tenancy and the module framework arrive in the next phases.
        </Card.Footer>
      </Card>
    </main>
  );
}
