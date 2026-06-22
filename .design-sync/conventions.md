# UniSentinel design system — how to build with it

UniSentinel is a GRC + ERP product (governance, risk, compliance, audits, controls, vendors,
approvals). Build interfaces that feel like enterprise security software: calm, dense, trustworthy.
Brand = deep navy (primary) + signal teal (accent).

## Setup — no provider needed

Components are styled by a global stylesheet whose design tokens live on `:root`. There is **no theme
provider or wrapper to mount** — import a component and use it. Do not wrap the app in any context.

## Style via props, then tokens — never invent classes

This is a **prop + token** system, not a utility-class system. Components carry their own styling; you
choose it through props (`variant`, `tone`, `size`, …). Do **not** pass `className` utility strings to
restyle a component — there is no class vocabulary to target.

For your **own layout glue** (wrappers, grids, spacing), use the design tokens as CSS variables in
inline styles or your own CSS. Never hardcode brand hex — use the token:

| Family | Real tokens |
|---|---|
| Brand color | `--us-color-primary` (navy), `--us-color-accent` (teal); ramps `--us-navy-50…900`, `--us-teal-50…900` |
| Text | `--us-color-text`, `--us-color-text-muted`, `--us-color-heading`, `--us-color-text-inverse` |
| Surfaces | `--us-color-bg`, `--us-color-bg-subtle`, `--us-color-surface`, `--us-color-border` |
| Status ramps | `--us-success-500`, `--us-warning-500`, `--us-danger-500`, `--us-info-500` (each has `-50/-100/-600/-700`) |
| Spacing (4px) | `--us-space-1 … --us-space-16` |
| Radius | `--us-radius-sm/md/lg/xl/pill` |
| Shadow | `--us-shadow-sm/md/lg`, `--us-shadow-focus` |
| Type | `--us-font-sans`, `--us-text-xs … --us-text-5xl`, `--us-weight-regular/medium/semibold/bold` |

**`tone`** is the semantic color prop on Badge, Tag, Alert, Progress, Spinner and Stat deltas:
`neutral · brand · info · success · warning · danger`. Use it instead of color props — e.g. an at-risk
badge is `<Badge tone="danger">`, a passing one `<Badge tone="success">`.

Common prop axes: `size` = `sm | md | lg` (form controls, Button, Spinner); Button `variant` =
`primary | accent | secondary | outline | ghost | danger`; form controls take `invalid`; Card `variant`
= `elevated | outlined | subtle`.

## Where the truth lives

Read these before styling: the bound stylesheet `_ds/<folder>/styles.css` (tokens + every component's
CSS) and the per-component `*.prompt.md` files (exact props + usage). The `.prompt.md` for a component
is the authoritative API reference.

## Components

Actions: Button. Forms: Input, Textarea, Select, Checkbox, RadioGroup, Switch. Data: Badge, Tag,
Avatar, Table, Stat. Feedback: Alert, Progress, Spinner, Skeleton, Tooltip. Navigation: Tabs,
Breadcrumb. Overlay: Modal. Layout: Card, Divider. Compound parts are statics: `Card.Header/Body/Footer/Title`,
`Tabs.List/Tab/Panel`, `Table.Head/Body/Row/Cell/HeaderCell`, `Modal.Header/Body/Footer`,
`RadioGroup.Option`, `Breadcrumb.Item`, `Avatar.Group`.

## One idiomatic example

```tsx
<Card variant="elevated" style={{ maxWidth: 380 }}>
  <Card.Header>
    <Card.Title subtitle="ISO 27001 · A.9">Privileged Access Review</Card.Title>
  </Card.Header>
  <Card.Body>
    <Stat label="Controls effective" value="12 / 14"
          delta={{ value: '2 overdue', direction: 'down' }} deltaTone="warning" />
  </Card.Body>
  <Card.Footer>
    <Badge tone="warning" dot>Needs review</Badge>
    <Button variant="primary" size="sm" style={{ marginLeft: 'auto' }}>Open review</Button>
  </Card.Footer>
</Card>
```

Layout glue (`maxWidth`, `marginLeft`) is the agent's; everything visible — color, type, spacing,
elevation — comes from the components and the `--us-*` tokens.
