import { Skeleton } from '@unisentinel/ui';

export const Text = () => (
  <div style={{ maxWidth: 360 }}>
    <Skeleton variant="text" lines={4} />
  </div>
);

export const Shapes = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    <Skeleton variant="circle" width={48} height={48} />
    <Skeleton variant="rect" width={140} height={80} />
    <Skeleton variant="rect" width={100} height={80} />
  </div>
);

export const CardLayout = () => (
  <div
    style={{
      border: '1px solid var(--us-color-border)',
      borderRadius: 12,
      padding: 16,
      maxWidth: 360,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    }}
  >
    <Skeleton variant="circle" width={40} height={40} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton variant="text" lines={1} />
      <Skeleton variant="text" lines={1} width="60%" />
    </div>
  </div>
);
