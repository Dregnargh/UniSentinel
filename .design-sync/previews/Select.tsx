import { Select } from '@unisentinel/ui';

const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--us-color-heading)', marginBottom: 4, display: 'block' };
const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 };

export const Frameworks = () => (
  <div style={stack}>
    <div>
      <label style={label}>Compliance framework</label>
      <Select placeholder="Select a framework" defaultValue="">
        <option value="soc2">SOC 2</option>
        <option value="iso27001">ISO 27001</option>
        <option value="gdpr">GDPR</option>
        <option value="hipaa">HIPAA</option>
        <option value="pcidss">PCI DSS</option>
        <option value="nistcsf">NIST CSF</option>
      </Select>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <Select size="sm" placeholder="Small — framework" defaultValue="">
      <option value="soc2">SOC 2</option>
      <option value="iso27001">ISO 27001</option>
    </Select>
    <Select size="md" placeholder="Medium — framework" defaultValue="">
      <option value="soc2">SOC 2</option>
      <option value="iso27001">ISO 27001</option>
    </Select>
    <Select size="lg" placeholder="Large — framework" defaultValue="">
      <option value="soc2">SOC 2</option>
      <option value="iso27001">ISO 27001</option>
    </Select>
  </div>
);

export const States = () => (
  <div style={stack}>
    <Select invalid placeholder="Select a framework" defaultValue="">
      <option value="soc2">SOC 2</option>
      <option value="iso27001">ISO 27001</option>
      <option value="gdpr">GDPR</option>
    </Select>
    <Select disabled placeholder="Assigned auditor (locked)" defaultValue="">
      <option value="deloitte">Deloitte</option>
      <option value="kpmg">KPMG</option>
    </Select>
  </div>
);
