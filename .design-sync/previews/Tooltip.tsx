import { Tooltip, Button } from '@unisentinel/ui';

const InfoCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const Placements = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      rowGap: 96,
      columnGap: 140,
      padding: '80px 170px',
      justifyItems: 'center',
    }}
  >
    <Tooltip defaultOpen placement="top" content="Maps to SOC 2 CC6.1">
      <Button variant="outline" size="sm">Top</Button>
    </Tooltip>
    <Tooltip defaultOpen placement="bottom" content="Owned by IAM team">
      <Button variant="outline" size="sm">Bottom</Button>
    </Tooltip>
    <Tooltip defaultOpen placement="left" content="Reviewed 4h ago">
      <Button variant="outline" size="sm">Left</Button>
    </Tooltip>
    <Tooltip defaultOpen placement="right" content="Risk tier: High">
      <Button variant="outline" size="sm">Right</Button>
    </Tooltip>
  </div>
);

export const OnInfo = () => (
  <div style={{ padding: '72px 200px', display: 'flex', justifyContent: 'center' }}>
    <Tooltip defaultOpen placement="top" content="Re-evaluated every 24 hours.">
      <span style={{ display: 'inline-flex', color: 'var(--us-color-text-muted)' }}>
        <InfoCircle />
      </span>
    </Tooltip>
  </div>
);
