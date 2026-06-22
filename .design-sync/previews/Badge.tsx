import { Badge } from '@unisentinel/ui';

const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };

export const Tones = () => (
  <div style={row}>
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="brand">Monitored</Badge>
    <Badge tone="info">In review</Badge>
    <Badge tone="success">Compliant</Badge>
    <Badge tone="warning">At risk</Badge>
    <Badge tone="danger">Failed</Badge>
  </div>
);

export const Variants = () => (
  <div style={row}>
    <Badge tone="success" variant="subtle">Compliant</Badge>
    <Badge tone="success" variant="solid">Compliant</Badge>
    <Badge tone="success" variant="outline">Compliant</Badge>
  </div>
);

export const WithDot = () => (
  <div style={row}>
    <Badge tone="success" dot>Active</Badge>
    <Badge tone="warning" dot>Pending</Badge>
    <Badge tone="danger" dot>Overdue</Badge>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Badge tone="info" size="sm">SOC 2 CC6.1</Badge>
    <Badge tone="info" size="md">SOC 2 CC6.1</Badge>
  </div>
);
