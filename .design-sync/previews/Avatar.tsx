import { Avatar } from '@unisentinel/ui';

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' };

export const Sizes = () => (
  <div style={row}>
    <Avatar size="xs" name="Jane Auditor" />
    <Avatar size="sm" name="Jane Auditor" />
    <Avatar size="md" name="Jane Auditor" />
    <Avatar size="lg" name="Jane Auditor" />
    <Avatar size="xl" name="Jane Auditor" />
  </div>
);

export const WithStatus = () => (
  <div style={row}>
    <Avatar size="md" name="Priya Nair" status="online" />
    <Avatar size="md" name="Marcus Webb" status="busy" />
    <Avatar size="md" name="Lena Ortiz" status="away" />
    <Avatar size="md" name="Tom Reyes" status="offline" />
  </div>
);

export const Fallbacks = () => (
  <div style={row}>
    <Avatar size="md" name="Dana Cole" />
    <Avatar size="md" />
    <Avatar size="md" name="Sam Okafor" shape="rounded" />
  </div>
);

export const Group = () => (
  <div style={row}>
    <Avatar.Group max={3}>
      <Avatar name="Jane Auditor" />
      <Avatar name="Priya Nair" />
      <Avatar name="Marcus Webb" />
      <Avatar name="Lena Ortiz" />
      <Avatar name="Tom Reyes" />
    </Avatar.Group>
  </div>
);
