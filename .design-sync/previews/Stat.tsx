import { Stat, Card } from '@unisentinel/ui';

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
  </svg>
);

export const Metrics = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
    <Stat label="Compliance score" value="92%" delta={{ value: '+4.2 pts', direction: 'up' }} hint="vs. last quarter" />
    <Stat label="Open risks" value="37" delta={{ value: '8 closed', direction: 'down' }} deltaTone="success" hint="12 high severity" />
    <Stat label="Overdue controls" value="5" delta={{ value: '+2', direction: 'up' }} deltaTone="danger" hint="SOC 2 CC6.x" />
  </div>
);

export const InCards = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
    <Card variant="elevated">
      <Card.Body>
        <Stat label="Frameworks tracked" value="14" icon={<ShieldIcon />} delta={{ value: '+3', direction: 'up' }} hint="SOC 2, ISO 27001, GDPR…" />
      </Card.Body>
    </Card>
    <Card variant="elevated">
      <Card.Body>
        <Stat label="Evidence freshness" value="96%" delta={{ value: 'stable', direction: 'flat' }} hint="auto-collected" />
      </Card.Body>
    </Card>
  </div>
);

export const Single = () => (
  <Card variant="outlined" style={{ maxWidth: 240 }}>
    <Card.Body>
      <Stat label="Annualized loss exposure" value="$1.2M" delta={{ value: '-14%', direction: 'down' }} deltaTone="success" hint="post-mitigation" />
    </Card.Body>
  </Card>
);
