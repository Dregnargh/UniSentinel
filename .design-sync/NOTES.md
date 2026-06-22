# design-sync notes — @unisentinel/ui

Repo-specific gotchas for syncing this design system to claude.ai/design (package shape).

## Build / converter wiring

- **Build command:** `npm run build` (`cfg.buildCmd`). It runs `scripts/build.mjs`: esbuild bundles `src/index.ts` → `dist/index.js` (ESM, react/react-dom/react/jsx-runtime externalized); esbuild bundles CSS → `dist/styles.css` and `dist/tokens.css`; `tsc -p tsconfig.build.json` emits the `dist/` `.d.ts` tree. Converter entry: `--entry ./dist/index.js`.
- **Converter deps install:** `npm --prefix .ds-sync i esbuild ts-morph @types/react playwright` — do NOT use `cd .ds-sync && npm i ...` (the `cd` in a compound shell command silently installed nothing here). Chromium for the render check: `node .ds-sync/node_modules/playwright/cli.js install chromium` (cache lands under `%LOCALAPPDATA%\ms-playwright`, NOT `~/.cache/ms-playwright`).

## Tokens are embedded in cssEntry (important)

- The converter's `copyTokens` only pulls tokens from a **separate `tokensPkg`** (a node_modules package). This is a **monolithic** package (tokens live in `dist/tokens.css` in the same package), so `tokensPkg`/`tokensGlob` do nothing here.
- Fix: `scripts/build.mjs` inlines `@import "./tokens.css"` FIRST into `dist/styles.css` (the `cfg.cssEntry`), so the `:root` token block ships inside `_ds_bundle.css` and reaches every rendered design via the `styles.css` import closure. `dist/tokens.css` is also emitted standalone for package consumers.
- If tokens ever stop shipping you'll see `[TOKENS_MISSING]` listing `--us-*` vars. Cause = tokens dropped out of the `cssEntry` closure. Keep the `@import "./tokens.css"` line in `build.mjs`.

## Component grouping (@category)

- The DS-pane group comes from a single-word `@category <Group>` tag in the **leading JSDoc of `export const <Name>`**. Groups in use: Actions, Forms, Data, Feedback, Navigation, Overlay, Layout.
- **Compound components** (`export const X = Object.assign(XBase, {...})`) must name their inner `forwardRef` function `<Name>Root` (NOT `<Name>`) and put the `@category` JSDoc directly above the `export const`. Otherwise `leadingJsdoc(name)` matches the inner `function <Name>` (no adjacent doc) and the component falls into `general`. Affected: Avatar, Breadcrumb, Card, Modal, RadioGroup, Table, Tabs.

## Package shape does NOT support card overrides

- This converter has **no** `cardMode`/`viewport`/`skip`/`GRID_OVERFLOW` support (those are storybook-shape only). So:
  - **Modal** preview = exactly ONE open-dialog cell (it portals an overlay over the whole card; multiple cells would overlap).
  - **Tooltip** previews use `defaultOpen` with generous cell padding so the open tooltip doesn't clip.
  - **Table** relies on its own `.us-table-scroll` horizontal scroll.

## Preview authoring contract

- `.design-sync/previews/<Name>.tsx`, markerless. `import { X } from '@unisentinel/ui'` (react external, JSX automatic — don't import React). Each named export = one card cell. Realistic GRC/ERP content.
- Library icons are NOT exported — inline tiny SVGs (stroke=currentColor) for `leftIcon`/`icon` props.
- Layout glue = inline styles using `var(--us-*)` tokens (never hardcode brand hex).
- Avatar previews avoid external image URLs (capture runs offline → would fall back to initials anyway).

## Fonts

- System font stack only (`--us-font-sans`/`--us-font-mono` reference only generic/system families), so `[FONT_MISSING]` does not fire and nothing needs shipping in `fonts/`.

## Re-sync risks (watch-list for the next run)

- **Token embedding** is a `build.mjs` detail, not a converter feature — if `build.mjs` is refactored, re-confirm `:root` tokens are present in `dist/styles.css` (grep `:root`) or designs render unstyled.
- **Compound inner-fn naming** (`<Name>Root`) is load-bearing for grouping — keep it for any new Object.assign component.
- All 22 previews are authored + graded `good`; grades live in gitignored `.cache/` — cross-machine carry-forward comes from the uploaded `_ds_sync.json`. A fresh clone re-verifies if the anchor is missing.
