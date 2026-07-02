"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Switch, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { setEmailNotifications } from "@/platform/notify/actions";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
  revokeOwnSession,
  updateProfileName,
  type ConfirmTotpState,
  type TotpEnrollment,
} from "@/platform/profile/actions";

interface SessionRow {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  ip: string | null;
  userAgent: string | null;
  current: boolean;
}

export function ProfileClient({
  user,
  sessions,
}: {
  user: {
    name: string;
    email: string;
    roleNames: string[];
    totpEnabled: boolean;
    emailNotifications: boolean;
  };
  sessions: SessionRow[];
}) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>My profile</h1>
          <p style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {user.email}
            {user.roleNames.map((r) => (
              <Badge key={r} tone={r === "Administrator" ? "brand" : "neutral"}>
                {r}
              </Badge>
            ))}
          </p>
        </div>
      </div>
      <NameCard name={user.name} />
      <NotificationsCard emailNotifications={user.emailNotifications} />
      <TwoFactorCard enabled={user.totpEnabled} />
      <SessionsCard sessions={sessions} />
    </div>
  );
}

function NotificationsCard({ emailNotifications }: { emailNotifications: boolean }) {
  const [pending, startTransition] = useTransition();
  const toggle = (enabled: boolean) =>
    startTransition(async () => {
      await setEmailNotifications(enabled);
    });
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="In-app notifications are always on; email delivery is your choice">
          Notifications
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <Switch
          defaultChecked={emailNotifications}
          disabled={pending}
          onChange={(e) => toggle(e.target.checked)}
          label="Also send my notifications by email"
        />
      </Card.Body>
    </Card>
  );
}

function NameCard({ name }: { name: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfileName, {});
  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="How your name appears across the platform">Account</Card.Title>
      </Card.Header>
      <Card.Body>
        <form action={action} className="form-grid" style={{ maxWidth: 420 }}>
          {state.error && <Alert tone="danger">{state.error}</Alert>}
          {state.ok && <Alert tone="success">Saved.</Alert>}
          <label htmlFor="name">Display name</label>
          <Input id="name" name="name" defaultValue={name} required />
          <div>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
        <p className="muted" style={{ marginBottom: 0 }}>
          Password: <Link href="/change-password">change your password</Link>.
        </p>
      </Card.Body>
    </Card>
  );
}

function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [enrollment, setEnrollment] = React.useState<TotpEnrollment | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [disableOpen, setDisableOpen] = React.useState(false);

  const begin = () =>
    startTransition(async () => {
      setError(null);
      const result = await beginTotpEnrollment();
      if ("error" in result) setError(result.error);
      else setEnrollment(result);
    });

  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="Time-based one-time codes from an authenticator app">
          Two-factor authentication
        </Card.Title>
      </Card.Header>
      <Card.Body>
        {error && <Alert tone="danger">{error}</Alert>}
        {enabled ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--us-space-3)" }}>
            <Badge tone="success" dot>
              enabled
            </Badge>
            <Button variant="outline" onClick={() => setDisableOpen(true)}>
              Disable…
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--us-space-3)" }}>
            <Badge tone="warning" dot>
              not enabled
            </Badge>
            <Button onClick={begin} loading={starting}>
              Enable two-factor…
            </Button>
          </div>
        )}
      </Card.Body>
      <EnrollModal enrollment={enrollment} onClose={() => setEnrollment(null)} />
      <DisableModal open={disableOpen} onClose={() => setDisableOpen(false)} />
    </Card>
  );
}

function EnrollModal({ enrollment, onClose }: { enrollment: TotpEnrollment | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<ConfirmTotpState, FormData>(confirmTotpEnrollment, {});
  return (
    <Modal open={enrollment !== null} onClose={onClose} title="Enable two-factor authentication" size="md">
      <Modal.Body>
        {state.ok && state.recoveryCodes ? (
          <div className="stack">
            <Alert tone="success" title="Two-factor authentication is on">
              Store these one-time recovery codes somewhere safe — each works once if you lose your
              authenticator. They are shown only now.
            </Alert>
            <div className="recovery-codes">
              {state.recoveryCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        ) : (
          enrollment && (
            <div className="stack">
              <p style={{ margin: 0 }}>
                Scan the QR code with your authenticator app (or enter the key manually), then confirm
                with a code.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrollment.qrDataUrl} alt="TOTP enrollment QR code" width={220} height={220} />
              <p className="mono" style={{ margin: 0, fontSize: "var(--us-text-sm)", wordBreak: "break-all" }}>
                {enrollment.secret}
              </p>
              <form action={action} className="form-grid" style={{ maxWidth: 260 }}>
                {state.error && <Alert tone="danger">{state.error}</Alert>}
                <label htmlFor="totp-confirm">6-digit code</label>
                <Input id="totp-confirm" name="code" inputMode="numeric" required placeholder="123456" />
                <div>
                  <Button type="submit" loading={pending}>
                    Confirm &amp; enable
                  </Button>
                </div>
              </form>
            </div>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {state.ok ? "Done" : "Cancel"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DisableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(disableTotp, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);
  return (
    <Modal open={open} onClose={onClose} title="Disable two-factor authentication" size="sm">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            <p style={{ margin: 0 }}>Confirm with your password to turn off two-factor authentication.</p>
            <label htmlFor="disable-password">Password</label>
            <Input id="disable-password" name="password" type="password" autoComplete="current-password" required />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" loading={pending}>
            Disable
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function SessionsCard({ sessions }: { sessions: SessionRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const revoke = (id: string) =>
    startTransition(async () => {
      const result = await revokeOwnSession(id);
      setError(result.error ?? null);
    });

  return (
    <Card>
      <Card.Header>
        <Card.Title subtitle="Everywhere you're signed in — revoke anything you don't recognize">
          Active sessions
        </Card.Title>
      </Card.Header>
      <Card.Body>
        {error && <Alert tone="danger">{error}</Alert>}
        <Table hoverable>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Signed in</Table.HeaderCell>
              <Table.HeaderCell>Last active</Table.HeaderCell>
              <Table.HeaderCell>IP</Table.HeaderCell>
              <Table.HeaderCell>Device</Table.HeaderCell>
              <Table.HeaderCell align="right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {sessions.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>{s.createdAt.replace("T", " ").slice(0, 16)}</Table.Cell>
                <Table.Cell>{s.lastSeenAt.replace("T", " ").slice(0, 16)}</Table.Cell>
                <Table.Cell>{s.ip ?? "—"}</Table.Cell>
                <Table.Cell style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.userAgent ?? "—"}
                </Table.Cell>
                <Table.Cell align="right">
                  {s.current ? (
                    <Badge tone="info">this session</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => revoke(s.id)} loading={pending}>
                      Revoke
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}
