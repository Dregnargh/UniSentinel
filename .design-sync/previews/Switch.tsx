import { Switch } from '@unisentinel/ui';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 };

export const Settings = () => (
  <div style={stack}>
    <Switch defaultChecked label="Continuous control monitoring" />
    <Switch label="Email alerts for failed controls" />
    <Switch defaultChecked label="Auto-collect evidence" />
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <Switch size="sm" defaultChecked label="Daily evidence sync" />
    <Switch size="md" defaultChecked label="Risk score recalculation" />
    <Switch size="lg" defaultChecked label="Vendor reassessment reminders" />
  </div>
);

export const States = () => (
  <div style={stack}>
    <Switch defaultChecked label="Enforce SSO for the audit portal" />
    <Switch label="Allow self-service access requests" />
    <Switch disabled defaultChecked label="Regulatory reporting (managed by admin)" />
  </div>
);
