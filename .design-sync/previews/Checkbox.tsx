import { Checkbox } from '@unisentinel/ui';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };

export const Single = () => (
  <Checkbox
    defaultChecked
    label="MFA enforced for all admins"
    description="Applies to 1,204 privileged accounts"
  />
);

export const Group = () => (
  <div style={stack}>
    <Checkbox defaultChecked label="Encryption at rest" />
    <Checkbox label="Audit logging enabled" />
    <Checkbox defaultChecked label="Access reviews quarterly" />
    <Checkbox label="Backups tested" />
  </div>
);

export const States = () => (
  <div style={stack}>
    <Checkbox defaultChecked label="Control operating effectively" />
    <Checkbox indeterminate label="3 of 7 evidence items collected" />
    <Checkbox disabled label="Inherited from parent policy" description="Locked by ISO 27001 baseline" />
    <Checkbox invalid label="Data residency attestation" description="Required before SOC 2 submission" />
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <Checkbox size="sm" defaultChecked label="Vendor accepted DPA" />
    <Checkbox size="md" defaultChecked label="Penetration test scheduled" />
    <Checkbox size="lg" defaultChecked label="Incident response plan approved" />
  </div>
);
