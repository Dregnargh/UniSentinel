import { Button } from '@unisentinel/ui';

const Shield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const row: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' };

export const Variants = () => (
  <div style={row}>
    <Button variant="primary">Run assessment</Button>
    <Button variant="accent">Export report</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="ghost">Dismiss</Button>
    <Button variant="danger">Revoke access</Button>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const WithIcons = () => (
  <div style={row}>
    <Button variant="primary" leftIcon={<Shield />}>Run scan</Button>
    <Button variant="accent" rightIcon={<ArrowRight />}>Continue</Button>
    <Button variant="outline" leftIcon={<Plus />}>Add control</Button>
    <Button variant="primary" iconOnly aria-label="Run scan"><Shield /></Button>
  </div>
);

export const States = () => (
  <div style={row}>
    <Button variant="primary" loading>Submitting…</Button>
    <Button variant="accent" loading>Scanning…</Button>
    <Button variant="primary" disabled>Disabled</Button>
    <Button variant="outline" disabled>Unavailable</Button>
  </div>
);
