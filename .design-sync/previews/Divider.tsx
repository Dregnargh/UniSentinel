import { Divider } from '@unisentinel/ui';

const muted: React.CSSProperties = {
  margin: 0,
  color: 'var(--us-color-text-muted)',
  fontSize: 'var(--us-text-md)',
  lineHeight: 1.5,
};

export const Horizontal = () => (
  <div style={{ maxWidth: 420 }}>
    <p style={muted}>
      The SOC 2 readiness assessment covers 247 controls across five trust service criteria.
    </p>
    <Divider />
    <p style={muted}>
      Evidence is auto-collected every 24 hours and mapped to each control owner.
    </p>
    <Divider label="OR" />
    <p style={muted}>
      Upload an existing audit report to seed your control library.
    </p>
  </div>
);

export const Vertical = () => (
  <div style={{ display: 'flex', alignItems: 'center', maxWidth: 420, color: 'var(--us-color-text)', fontSize: 'var(--us-text-sm)' }}>
    <span>SOC 2</span>
    <Divider orientation="vertical" />
    <span>ISO 27001</span>
    <Divider orientation="vertical" />
    <span>GDPR</span>
  </div>
);

export const Variants = () => (
  <div style={{ maxWidth: 420 }}>
    <p style={muted}>14 of 16 access reviews complete for this quarter.</p>
    <Divider variant="dashed" />
    <p style={muted}>2 reviews remain pending sign-off from the IAM team.</p>
  </div>
);
