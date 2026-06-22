import { Table, Badge } from '@unisentinel/ui';

export const ControlRegister = () => (
  <Table style={{ width: 640 }}>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell>Control</Table.HeaderCell>
        <Table.HeaderCell>Framework</Table.HeaderCell>
        <Table.HeaderCell>Owner</Table.HeaderCell>
        <Table.HeaderCell align="right">Status</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      <Table.Row>
        <Table.Cell>AC-2 Account Management</Table.Cell>
        <Table.Cell>SOC 2</Table.Cell>
        <Table.Cell>J. Auditor</Table.Cell>
        <Table.Cell align="right"><Badge tone="success">Effective</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>A.9.4 Access Restriction</Table.Cell>
        <Table.Cell>ISO 27001</Table.Cell>
        <Table.Cell>M. Okafor</Table.Cell>
        <Table.Cell align="right"><Badge tone="warning">Needs review</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Art. 32 Encryption at Rest</Table.Cell>
        <Table.Cell>GDPR</Table.Cell>
        <Table.Cell>S. Reyes</Table.Cell>
        <Table.Cell align="right"><Badge tone="danger">Failing</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>CC6.1 Logical Access</Table.Cell>
        <Table.Cell>SOC 2</Table.Cell>
        <Table.Cell>J. Auditor</Table.Cell>
        <Table.Cell align="right"><Badge tone="success">Effective</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>A.12.4 Event Logging</Table.Cell>
        <Table.Cell>ISO 27001</Table.Cell>
        <Table.Cell>K. Lindqvist</Table.Cell>
        <Table.Cell align="right"><Badge tone="warning">Needs review</Badge></Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
);

export const Striped = () => (
  <Table striped hoverable style={{ width: 640 }}>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell>Control</Table.HeaderCell>
        <Table.HeaderCell>Framework</Table.HeaderCell>
        <Table.HeaderCell>Owner</Table.HeaderCell>
        <Table.HeaderCell align="right">Status</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      <Table.Row>
        <Table.Cell>AC-2 Account Management</Table.Cell>
        <Table.Cell>SOC 2</Table.Cell>
        <Table.Cell>J. Auditor</Table.Cell>
        <Table.Cell align="right"><Badge tone="success">Effective</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>A.9.4 Access Restriction</Table.Cell>
        <Table.Cell>ISO 27001</Table.Cell>
        <Table.Cell>M. Okafor</Table.Cell>
        <Table.Cell align="right"><Badge tone="warning">Needs review</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Art. 32 Encryption at Rest</Table.Cell>
        <Table.Cell>GDPR</Table.Cell>
        <Table.Cell>S. Reyes</Table.Cell>
        <Table.Cell align="right"><Badge tone="danger">Failing</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>CC6.1 Logical Access</Table.Cell>
        <Table.Cell>SOC 2</Table.Cell>
        <Table.Cell>J. Auditor</Table.Cell>
        <Table.Cell align="right"><Badge tone="success">Effective</Badge></Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>A.12.4 Event Logging</Table.Cell>
        <Table.Cell>ISO 27001</Table.Cell>
        <Table.Cell>K. Lindqvist</Table.Cell>
        <Table.Cell align="right"><Badge tone="warning">Needs review</Badge></Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
);
