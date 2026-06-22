import { Input } from '@unisentinel/ui';

const Search = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--us-color-heading)', marginBottom: 4, display: 'block' };
const helper: React.CSSProperties = { color: 'var(--us-danger-600)', fontSize: 12, marginTop: 4 };

export const Labeled = () => (
  <div style={field}>
    <div>
      <label style={label}>Control ID</label>
      <Input placeholder="AC-2" />
    </div>
    <div>
      <label style={label}>Asset owner</label>
      <Input placeholder="jane@acme.com" />
    </div>
    <div>
      <label style={label}>Framework reference</label>
      <Input placeholder="SOC 2 CC6.1" />
    </div>
  </div>
);

export const WithIcons = () => (
  <div style={field}>
    <Input leftIcon={<Search />} placeholder="Search controls…" />
  </div>
);

export const States = () => (
  <div style={field}>
    <div>
      <Input invalid placeholder="Control ID" />
      <div style={helper}>Control ID is required</div>
    </div>
    <Input disabled placeholder="Auto-assigned owner" />
  </div>
);

export const Sizes = () => (
  <div style={field}>
    <Input size="sm" placeholder="Small — AC-2" />
    <Input size="md" placeholder="Medium — AC-2" />
    <Input size="lg" placeholder="Large — AC-2" />
  </div>
);
