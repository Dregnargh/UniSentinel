import { Spinner } from '@unisentinel/ui';

export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </div>
);

export const Tones = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    <Spinner tone="brand" />
    <Spinner tone="info" />
    <Spinner tone="success" />
  </div>
);

export const InContext = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Spinner size="md" />
    <span style={{ color: 'var(--us-color-text-muted)' }}>Scanning 1,204 assets…</span>
  </div>
);
