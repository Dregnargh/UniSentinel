# Staging environment & the enhancement loop

The staging box is where every module gets hands-on tested before it counts
as done (roadmap Phase 10). It is a normal bundle install that follows the
`:staging` image tag instead of a pinned release.

## How builds reach staging

Every push to `main` runs `.github/workflows/staging.yml`: build → the same
compose boot test CI uses **plus a seed-demo run** → publish
`ghcr.io/<owner>/unisentinel:staging` and an immutable `sha-<short>` tag.
A broken build never reaches the staging tag. (`workflow_dispatch` can
publish from a feature branch before it merges.)

## Standing up the staging box (once)

Any Linux host with Docker — a small VPS or a LAN machine.

```bash
tar xzf unisentinel-bundle-<version>.tar.gz && mv unisentinel-bundle-<version> unisentinel-staging
cd unisentinel-staging
./install.sh --no-start
# .env changes for staging:
#   TAG=staging
#   COOKIE_SECURE=false        # if plain-HTTP LAN access (see install.md)
docker compose up -d
```

Then seed the demo workspace (fresh instances only):

```bash
docker compose run --rm web seed-demo
```

It prints the three demo logins (`demo-admin@`, `demo-risk@`,
`demo-tasks@acme.test`) and one generated password (or set
`SEED_DEMO_PASSWORD` in the environment for a fixed one). The seed covers
catalog, tasks, risks, dashboards and reports, and deliberately leaves
RSK-2 with unpromoted local data so the promotion wizard can be exercised.

Licensing: the seed grants all shipped modules for 365 days directly
(source `manual`). To test the real license path instead, sign one with
your dev keypair:

```bash
node deploy/licensing/keygen.mjs keys/                       # once
node deploy/licensing/sign-license.mjs --key keys/license-signing.private.pem \
  --customer "Staging" --modules catalog,tasks,risk --expires 2027-12-31 > staging.license
# put the PUBLIC key in .env as LICENSE_PUBLIC_KEY, then upload
# staging.license under Settings → License.
```

## Picking up new builds

```bash
docker compose pull web && docker compose up -d      # quick refresh
UNISENTINEL_WAIT_TRIES=40 ./upgrade.sh --version staging --skip-backup   # health-checked
```

(`upgrade.sh` refuses when TAG already equals the target — for the moving
`staging` tag use the quick refresh, or pin an immutable `sha-<short>` tag
with `./upgrade.sh --version sha-<short>`.)

To reset staging to a clean seeded state:

```bash
docker compose down -v && docker compose up -d
docker compose run --rm web seed-demo
```

## The enhancement loop (standing process)

1. After each module phase lands, refresh staging and walk the module with
   the demo data — as the roles it targets (`demo-risk@`, `demo-tasks@`),
   not only as the admin.
2. File everything that feels off as a GitHub issue labeled
   `enhancement` + `module:<key>` (one issue per observation, a screenshot
   beats a paragraph).
3. The next phase starts by triaging and clearing the accepted items —
   a module is "done" after its staging review round, not after its e2e
   suite passes.
