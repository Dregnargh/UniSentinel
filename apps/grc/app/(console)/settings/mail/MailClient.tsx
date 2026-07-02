"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { sendTestEmail, updateMailSettings } from "@/platform/notify/mail-actions";

interface MailInitial {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  from: string;
}

export function MailClient({
  configured,
  hasPassword,
  initial,
  adminEmail,
}: {
  configured: boolean;
  hasPassword: boolean;
  initial: MailInitial | null;
  adminEmail: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMailSettings, {});
  const [testResult, setTestResult] = React.useState<ActionState | null>(null);
  const [testing, startTest] = useTransition();

  const runTest = () =>
    startTest(async () => {
      setTestResult(await sendTestEmail());
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Mail</h1>
          <p>
            Outgoing email (SMTP) for notifications — invitations, role changes, and later:
            attestation requests, task assignments and report deliveries.
          </p>
        </div>
        <Badge tone={configured ? "success" : "warning"} dot>
          {configured ? "configured" : "not configured"}
        </Badge>
      </div>

      <Card>
        <Card.Body>
          <form action={action} className="form-grid" style={{ maxWidth: 480 }}>
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {state.ok && <Alert tone="success">Settings saved.</Alert>}
            <label htmlFor="mail-host">SMTP host</label>
            <Input id="mail-host" name="host" defaultValue={initial?.host} required placeholder="smtp.example.com" />
            <label htmlFor="mail-port">Port</label>
            <Input id="mail-port" name="port" type="number" defaultValue={initial?.port ?? 587} required />
            <Checkbox
              name="secure"
              value="true"
              defaultChecked={initial?.secure ?? false}
              label="Implicit TLS (port 465)"
              description="Leave unchecked for STARTTLS on 587 or plaintext relays."
            />
            <label htmlFor="mail-username">Username (optional)</label>
            <Input id="mail-username" name="username" defaultValue={initial?.username} autoComplete="off" />
            <label htmlFor="mail-password">Password</label>
            <Input
              id="mail-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={hasPassword ? "•••••• (leave blank to keep, “-” to clear)" : "Leave blank if none"}
            />
            <label htmlFor="mail-from">From address</label>
            <Input id="mail-from" name="from" defaultValue={initial?.from} required placeholder="UniSentinel <no-reply@company.com>" />
            <div style={{ display: "flex", gap: "var(--us-space-2)" }}>
              <Button type="submit" loading={pending}>
                Save settings
              </Button>
              <Button type="button" variant="outline" onClick={runTest} loading={testing} disabled={!configured}>
                Send test email
              </Button>
            </div>
            {testResult?.ok && <Alert tone="success">Test email sent to {adminEmail}.</Alert>}
            {testResult?.error && <Alert tone="danger">{testResult.error}</Alert>}
          </form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <p className="muted" style={{ margin: 0 }}>
            The password is encrypted at rest (AES-256-GCM). Notification emails are delivered by
            the worker process with automatic retries; the test button sends synchronously so you
            get immediate feedback.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
