import { Alert } from '@unisentinel/ui';

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 540 };

export const Tones = () => (
  <div style={stack}>
    <Alert tone="info" title="Assessment scheduled">
      The Q3 SOC 2 readiness assessment begins on July 1. Evidence collection is now open.
    </Alert>
    <Alert tone="success" title="Control effective">
      MFA is enforced across all 1,204 privileged accounts.
    </Alert>
    <Alert tone="warning" title="Control drift detected">
      3 access reviews are overdue for SOC 2 CC6.1.
    </Alert>
    <Alert tone="danger" title="Critical finding">
      An unencrypted data store was discovered in the EU region. Remediate within 48 hours.
    </Alert>
  </div>
);

export const Solid = () => (
  <div style={stack}>
    <Alert tone="brand" variant="solid" title="Continuous monitoring is on">
      247 controls are evaluated automatically every 24 hours.
    </Alert>
    <Alert tone="danger" variant="solid" title="Breach response activated">
      Incident IR-2041 has been escalated to the security team.
    </Alert>
  </div>
);

export const Dismissible = () => (
  <div style={stack}>
    <Alert tone="info" title="New framework available" onClose={() => {}}>
      NIST CSF 2.0 mappings can now be imported into your control library.
    </Alert>
    <Alert tone="warning" onClose={() => {}}>
      Your evidence for PCI DSS Requirement 10 expires in 7 days.
    </Alert>
  </div>
);

export const Inline = () => (
  <div style={stack}>
    <Alert tone="success" icon={false}>Policy acknowledged by 98% of employees.</Alert>
  </div>
);
