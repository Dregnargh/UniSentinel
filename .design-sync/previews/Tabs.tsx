import { Tabs } from '@unisentinel/ui';

const muted: React.CSSProperties = { margin: '12px 0 0', color: 'var(--us-color-text-muted)', fontSize: 'var(--us-text-md)', lineHeight: 1.5 };

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 3 14 8 19 8" />
  </svg>
);
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 4 2 18a1.7 1.7 0 0 0 1.5 2.5h17A1.7 1.7 0 0 0 22 18L13.7 4a1.7 1.7 0 0 0-3 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const Line = () => (
  <Tabs variant="line" defaultValue="overview" style={{ maxWidth: 560 }}>
    <Tabs.List>
      <Tabs.Tab value="overview">Overview</Tabs.Tab>
      <Tabs.Tab value="findings">Findings</Tabs.Tab>
      <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="overview">
      <p style={muted}>
        The SOC 2 Type II audit covers 247 controls across five trust service criteria.
        Fieldwork is 78% complete with an estimated report date of August 14.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="findings">
      <p style={muted}>
        3 exceptions were raised this period — all relate to overdue access reviews under CC6.1.
        Remediation owners have been assigned and are due within 10 business days.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="evidence">
      <p style={muted}>
        128 evidence artifacts have been collected automatically. 4 items require a manual
        upload from the Identity &amp; Access Management team before sign-off.
      </p>
    </Tabs.Panel>
  </Tabs>
);

export const Soft = () => (
  <Tabs variant="soft" defaultValue="risks" style={{ maxWidth: 560 }}>
    <Tabs.List>
      <Tabs.Tab value="risks">Risks</Tabs.Tab>
      <Tabs.Tab value="controls">Controls</Tabs.Tab>
      <Tabs.Tab value="vendors">Vendors</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="risks">
      <p style={muted}>
        37 open risks are tracked in the register. 12 are rated high severity and carry a
        combined annualized loss exposure of $1.2M after mitigation.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="controls">
      <p style={muted}>
        412 controls are mapped across SOC 2, ISO 27001, and NIST CSF. 96% are operating
        effectively; 5 are overdue for their quarterly attestation.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="vendors">
      <p style={muted}>
        86 active vendors are under continuous monitoring. 4 high-tier suppliers have a
        security review due before the end of the quarter.
      </p>
    </Tabs.Panel>
  </Tabs>
);

export const WithIcons = () => (
  <Tabs variant="line" defaultValue="summary" style={{ maxWidth: 560 }}>
    <Tabs.List>
      <Tabs.Tab value="summary" leftIcon={<FileIcon />}>Summary</Tabs.Tab>
      <Tabs.Tab value="exceptions" leftIcon={<AlertIcon />}>Exceptions</Tabs.Tab>
      <Tabs.Tab value="signoff" leftIcon={<CheckIcon />}>Sign-off</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="summary">
      <p style={muted}>
        The ISO 27001 surveillance audit is scoped to Annex A controls A.5 through A.18 for the
        production environment hosted in the EU region.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="exceptions">
      <p style={muted}>
        2 minor nonconformities were recorded. Both have corrective action plans approved by
        the control owner and the compliance lead.
      </p>
    </Tabs.Panel>
    <Tabs.Panel value="signoff">
      <p style={muted}>
        Awaiting final sign-off from the CISO. Once approved, the certificate of compliance will
        be issued and logged to the audit trail.
      </p>
    </Tabs.Panel>
  </Tabs>
);
