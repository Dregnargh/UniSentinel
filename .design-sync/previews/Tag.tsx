import { Tag } from '@unisentinel/ui';

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };

export const Frameworks = () => (
  <div style={row}>
    <Tag onRemove={() => {}}>SOC 2</Tag>
    <Tag onRemove={() => {}}>ISO 27001</Tag>
    <Tag onRemove={() => {}}>GDPR</Tag>
    <Tag onRemove={() => {}}>PCI DSS</Tag>
  </div>
);

export const Tones = () => (
  <div style={row}>
    <Tag tone="neutral">Unscoped</Tag>
    <Tag tone="brand">Monitored</Tag>
    <Tag tone="info">In review</Tag>
    <Tag tone="success">Effective</Tag>
    <Tag tone="warning">Expiring</Tag>
    <Tag tone="danger">Failed</Tag>
  </div>
);

export const WithIcon = () => (
  <div style={row}>
    <Tag leftIcon={<TagIcon />}>Tagged</Tag>
    <Tag tone="info" variant="outline" leftIcon={<TagIcon />}>Access Control</Tag>
  </div>
);
