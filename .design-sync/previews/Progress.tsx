import { Progress } from '@unisentinel/ui';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 };
const metric: React.CSSProperties = { fontSize: 13, color: 'var(--us-color-text-muted)', marginBottom: 6 };

export const Tones = () => (
  <div style={stack}>
    <div>
      <div style={metric}>Assessment readiness</div>
      <Progress tone="brand" value={68} label />
    </div>
    <div>
      <div style={metric}>Evidence collected</div>
      <Progress tone="success" value={92} label />
    </div>
    <div>
      <div style={metric}>Controls reviewed</div>
      <Progress tone="warning" value={45} label />
    </div>
    <div>
      <div style={metric}>Overdue remediations</div>
      <Progress tone="danger" value={12} label />
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <Progress size="sm" tone="brand" value={60} />
    <Progress size="md" tone="brand" value={60} />
    <Progress size="lg" tone="brand" value={60} />
  </div>
);

export const Indeterminate = () => (
  <div style={stack}>
    <Progress tone="brand" indeterminate />
  </div>
);
