import { Card, Badge, Button, Divider } from '@unisentinel/ui';

const muted: React.CSSProperties = { margin: 0, color: 'var(--us-color-text-muted)', fontSize: 'var(--us-text-md)', lineHeight: 1.5 };

export const ControlReview = () => (
  <Card style={{ maxWidth: 400 }}>
    <Card.Header>
      <Card.Title subtitle="ISO 27001 · A.9 Access Control">Privileged Access Review</Card.Title>
    </Card.Header>
    <Card.Body>
      <p style={muted}>
        12 of 14 controls are operating effectively. Two access reviews are overdue and currently
        assigned to the Identity &amp; Access Management team.
      </p>
    </Card.Body>
    <Card.Footer>
      <Badge tone="warning" dot>2 overdue</Badge>
      <Button size="sm" variant="primary" style={{ marginLeft: 'auto' }}>Open review</Button>
    </Card.Footer>
  </Card>
);

export const Variants = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
    <Card variant="elevated">
      <Card.Body>
        <strong style={{ color: 'var(--us-color-heading)' }}>Elevated</strong>
        <p style={{ ...muted, marginTop: 6 }}>Shadowed surface for primary content.</p>
      </Card.Body>
    </Card>
    <Card variant="outlined">
      <Card.Body>
        <strong style={{ color: 'var(--us-color-heading)' }}>Outlined</strong>
        <p style={{ ...muted, marginTop: 6 }}>Bordered, flat surface.</p>
      </Card.Body>
    </Card>
    <Card variant="subtle">
      <Card.Body>
        <strong style={{ color: 'var(--us-color-heading)' }}>Subtle</strong>
        <p style={{ ...muted, marginTop: 6 }}>Muted fill for secondary panels.</p>
      </Card.Body>
    </Card>
  </div>
);

export const VendorSummary = () => (
  <Card variant="elevated" interactive style={{ maxWidth: 380 }}>
    <Card.Header>
      <Card.Title subtitle="Third-party risk">Acme Cloud Services</Card.Title>
    </Card.Header>
    <Card.Body>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={{ color: 'var(--us-color-text-muted)', fontSize: 'var(--us-text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk tier</div>
          <div style={{ fontWeight: 600, color: 'var(--us-color-heading)' }}>High</div>
        </div>
        <Divider orientation="vertical" />
        <div>
          <div style={{ color: 'var(--us-color-text-muted)', fontSize: 'var(--us-text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last audit</div>
          <div style={{ fontWeight: 600, color: 'var(--us-color-heading)' }}>Mar 2026</div>
        </div>
      </div>
    </Card.Body>
    <Card.Footer>
      <Badge tone="danger">Review due</Badge>
      <span style={{ marginLeft: 'auto', color: 'var(--us-color-text-subtle)', fontSize: 'var(--us-text-sm)' }}>SOC 2 · GDPR</span>
    </Card.Footer>
  </Card>
);
