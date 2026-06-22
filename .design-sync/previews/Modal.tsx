import { Modal, Button } from '@unisentinel/ui';

const body: React.CSSProperties = { margin: 0, color: 'var(--us-color-text-muted)', fontSize: 'var(--us-text-md)', lineHeight: 1.5 };

export const RevokeAccess = () => (
  <Modal open={true} onClose={() => {}} size="md" title="Revoke privileged access?">
    <Modal.Body>
      <p style={body}>
        This immediately revokes Jane Auditor's privileged access to 14 production systems.
        The action is logged to the audit trail.
      </p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline">Cancel</Button>
      <Button variant="danger">Revoke access</Button>
    </Modal.Footer>
  </Modal>
);
