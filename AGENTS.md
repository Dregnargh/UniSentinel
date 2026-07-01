# UniSentinel monorepo — agent notes

- `apps/grc` = the GRC product (self-hostable web + worker). `apps/website` =
  marketing + internal CRM (Vercel). `packages/ui` = design system.
  `packages/db` = product schema + drizzle-kit migrations. Architecture and
  roadmap: `GRC-APP-PLAN.md`.
- **Next.js is a modified 16.2.9** with breaking changes vs training data.
  Read the relevant guide in `node_modules/next/dist/docs/` before writing
  Next code. `proxy.ts` replaces `middleware.ts`.
- The product must run on Windows Server natively: no Unix-only deps, no
  POSIX shell-outs, `path.join` everywhere. CI enforces via a windows-latest job.
- Product code never imports from `apps/website`, and `apps/website` never
  ships in the product image (see `.dockerignore`).
- Schema changes: edit `packages/db/src/schema/`, then
  `npm run generate -w @unisentinel/db -- --name <change>` to emit a
  versioned SQL migration. Never edit applied migrations.
- `@unisentinel/ui` components are client components ("use client" banner).
  Render them ONLY from client components — server pages stay thin and pass
  serialized data to a `*Client.tsx` island. Compound statics (`Card.Header`,
  `Table.Row`, …) resolve to undefined across the server→client reference
  boundary and fail at runtime with "Element type is invalid", while the
  build stays green — you will not catch it without rendering the page.
