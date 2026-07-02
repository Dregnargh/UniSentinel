# UniSentinel licensing (vendor side)

Licenses are Ed25519-signed JSON files, verified **offline** by instances —
no phone-home, air-gap friendly.

## One-time: generate the signing keypair

```bash
node deploy/licensing/keygen.mjs ~/unisentinel-keys
```

- `license-signing.private.pem` — **keep offline**. Whoever has it can issue
  UniSentinel licenses. Never commit it.
- `license-signing.public.pem` — configure on instances via the
  `LICENSE_PUBLIC_KEY` env var (the keygen also prints a base64 form that is
  safe in `.env` files). At GA, bake this key into the build
  (`apps/grc/platform/licensing/license.ts` → `BAKED_PUBLIC_KEY_PEM`) so
  customers don't configure anything.

## Issue a license

```bash
node deploy/licensing/sign-license.mjs \
  --key ~/unisentinel-keys/license-signing.private.pem \
  --customer "Acme Corporation" \
  --modules catalog,tasks,risk \
  --expires 2027-01-01 > acme.license
```

The customer uploads the file at **Settings → License**. Expired licenses put
modules into `expired` status (read-only enforcement is a module concern;
data is never locked in).
