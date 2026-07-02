"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Button, Card } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { removeLogo, uploadLogo } from "@/platform/branding-actions";

export function BrandingClient({ hasLogo }: { hasLogo: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadLogo, {});
  const [removing, startRemove] = useTransition();
  // Bust the logo cache after changes within this session.
  const [bust, setBust] = React.useState(0);
  React.useEffect(() => {
    if (state.ok) setBust((b) => b + 1);
  }, [state.ok]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Branding</h1>
          <p>
            Your company logo appears in the top bar and on the sign-in screen now, and on report
            headers once reporting lands.
          </p>
        </div>
      </div>
      <Card>
        <Card.Header>
          <Card.Title subtitle="PNG, JPEG or WebP, up to 1 MB — transparent PNG on the dark top bar works best">
            Company logo
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="stack" style={{ maxWidth: 480 }}>
            {hasLogo && (
              <div
                style={{
                  padding: "var(--us-space-4)",
                  background: "var(--us-color-primary)",
                  borderRadius: "var(--us-radius-md)",
                  display: "inline-flex",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/branding/logo?v=${bust}`} alt="Current company logo" style={{ maxHeight: 48 }} />
              </div>
            )}
            <form action={action} className="form-grid">
              {state.error && <Alert tone="danger">{state.error}</Alert>}
              {state.ok && <Alert tone="success">Logo updated.</Alert>}
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required />
              <div style={{ display: "flex", gap: "var(--us-space-2)" }}>
                <Button type="submit" loading={pending}>
                  Upload logo
                </Button>
                {hasLogo && (
                  <Button
                    type="button"
                    variant="outline"
                    loading={removing}
                    onClick={() => startRemove(async () => void (await removeLogo()))}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
