# @unisentinel/ui

The **UniSentinel** design system — a React + TypeScript component library for building
governance, risk, compliance (GRC) and ERP interfaces. Built from the UniSentinel brand:
deep navy `#082850` and signal teal `#086888`.

- **22 components** across Actions, Forms, Data, Feedback, Navigation, Overlay and Layout.
- **CSS-variable design tokens** on `:root` — no theme provider required.
- **System font stack** — nothing to download, renders crisp everywhere.
- **Tree-shakeable ESM**, full TypeScript types, `react` as a peer dependency.

## Install

```bash
npm install @unisentinel/ui react react-dom
```

## Usage

Import the stylesheet once at your app root, then use components anywhere:

```tsx
import '@unisentinel/ui/styles.css';
import { Button, Card, Badge, Alert } from '@unisentinel/ui';

export function ControlCard() {
  return (
    <Card style={{ maxWidth: 400 }}>
      <Card.Header>
        <Card.Title subtitle="ISO 27001 · A.9">Privileged Access Review</Card.Title>
      </Card.Header>
      <Card.Body>12 of 14 controls effective.</Card.Body>
      <Card.Footer>
        <Badge tone="warning" dot>2 overdue</Badge>
        <Button variant="primary" size="sm" style={{ marginLeft: 'auto' }}>Open review</Button>
      </Card.Footer>
    </Card>
  );
}
```

`@unisentinel/ui/styles.css` bundles the design tokens, base layer, and every component's
styles. The tokens are also available standalone at `@unisentinel/ui/tokens.css`.

## Design tokens

All tokens are global CSS custom properties prefixed `--us-`, so you can use them in your own
layout without importing anything:

| Group | Examples |
|---|---|
| Brand color | `--us-color-primary` (navy), `--us-color-accent` (teal), `--us-navy-*`, `--us-teal-*` |
| Semantic roles | `--us-color-text`, `--us-color-text-muted`, `--us-color-heading`, `--us-color-border`, `--us-color-bg-subtle` |
| Semantic ramps | `--us-success-*`, `--us-warning-*`, `--us-danger-*`, `--us-info-*` |
| Spacing | `--us-space-1` … `--us-space-16` (4px scale) |
| Radii | `--us-radius-sm/md/lg/xl/pill` |
| Shadows | `--us-shadow-xs/sm/md/lg/xl`, `--us-shadow-focus` |
| Typography | `--us-font-sans/mono`, `--us-text-xs` … `--us-text-5xl`, `--us-weight-*` |

Components that carry a semantic status take a `tone` prop
(`neutral · brand · info · success · warning · danger`) which maps onto these ramps.

## Components

**Actions** — Button ·
**Forms** — Input, Textarea, Select, Checkbox, RadioGroup, Switch ·
**Data** — Badge, Tag, Avatar, Table, Stat ·
**Feedback** — Alert, Progress, Spinner, Skeleton, Tooltip ·
**Navigation** — Tabs, Breadcrumb ·
**Overlay** — Modal ·
**Layout** — Card, Divider

Compound components expose their parts as statics, e.g. `Card.Header` / `Card.Body` /
`Card.Footer` / `Card.Title`, `Tabs.List` / `Tabs.Tab` / `Tabs.Panel`,
`Table.Head` / `Table.Row` / `Table.Cell`, `Modal.Header` / `Modal.Body` / `Modal.Footer`,
`RadioGroup.Option`, `Breadcrumb.Item`, `Avatar.Group`.

## Development

```bash
npm install      # install dev deps (react, esbuild, typescript)
npm run build    # -> dist/index.js (ESM) + dist/index.d.ts + dist/styles.css + dist/tokens.css
npm run typecheck
```

The build (`scripts/build.mjs`) bundles JS with esbuild (react externalized), concatenates the
token + base + component CSS, and emits declarations with `tsc`.

## License

MIT
