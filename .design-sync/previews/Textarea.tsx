import { Textarea } from '@unisentinel/ui';

const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--us-color-heading)', marginBottom: 4, display: 'block' };
const helper: React.CSSProperties = { color: 'var(--us-danger-600)', fontSize: 12, marginTop: 4 };
const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };

export const Default = () => (
  <div style={{ ...stack, maxWidth: 440 }}>
    <div>
      <label style={label}>Remediation plan</label>
      <Textarea rows={4} placeholder="Describe the remediation plan and target completion date…" />
    </div>
  </div>
);

export const States = () => (
  <div style={{ ...stack, maxWidth: 440 }}>
    <div>
      <Textarea invalid rows={3} placeholder="Describe the finding…" />
      <div style={helper}>A finding summary is required before submitting evidence</div>
    </div>
    <Textarea disabled rows={3} placeholder="Auto-generated audit log (read-only)" />
  </div>
);

export const Sizes = () => (
  <div style={{ ...stack, maxWidth: 440 }}>
    <Textarea size="sm" rows={2} resize="vertical" placeholder="Small — control description…" />
    <Textarea size="md" rows={3} resize="vertical" placeholder="Medium — control description…" />
    <Textarea size="lg" rows={4} resize="vertical" placeholder="Large — control description…" />
  </div>
);
