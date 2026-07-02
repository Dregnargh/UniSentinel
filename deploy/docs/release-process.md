# Release process (vendor-side)

Audience: UniSentinel maintainers. Customers never need this file — their
docs ship inside the bundle.

## Cutting a release

```bash
git checkout main && git pull
git tag v0.2.0
git push origin v0.2.0
```

The `Release` workflow (`.github/workflows/release.yml`) then:

1. builds the production image with `APP_VERSION=v0.2.0` baked in;
2. **smoke-boots the exact image** (compose up, `/readyz`, `/healthz`
   version match) — a release that can't start fails here and nothing is
   published;
3. pushes `ghcr.io/<owner>/unisentinel:v0.2.0` and `:latest`;
4. builds `unisentinel-images-v0.2.0.tar.gz` (`docker save` of the product
   image **plus `postgres:16`** — the air-gap host pulls nothing);
5. runs `deploy/package-bundle.sh`, which assembles the customer bundle
   (scripts + compose + docs) and stamps `VERSION` and `IMAGE`/`TAG` into
   `.env.example`;
6. writes sha256 checksums and creates the GitHub Release with all three
   artifacts and generated notes.

## Versioning rules

- Semver tags, always prefixed: `vMAJOR.MINOR.PATCH`.
- DB migrations are forward-only and replay in order, so customers may
  skip versions; never edit an applied migration (repo rule).
- `:latest` always points at the newest release — the compose default for
  developers, while customer bundles pin an exact `TAG`.

## Registry access for customers

GHCR on a private repo requires a token to pull. Until the packages are
made public (or per-customer tokens exist), treat the **air-gap tarball as
the primary customer distribution channel** — it has no registry
dependency at all.

## Testing the packaging locally

```bash
deploy/package-bundle.sh v0.0.0-dev
tar tzf dist/unisentinel-bundle-v0.0.0-dev.tar.gz   # inspect contents
```

The bundle scripts have a shim-based dry-run harness used during
development; the release workflow's smoke boot covers the real stack.
