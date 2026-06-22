# Deploying UniSentinel.com (Vercel + GoDaddy)

The site is a Next.js 16 app in this `website/` folder. Two ways to ship it.

## Option A — Vercel + GitHub (recommended)

1. Push this repo to GitHub (if not already):
   ```
   git remote add origin https://github.com/<you>/unisentinel.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and **import the repo**.
3. In project settings set **Root Directory = `website`** (this app lives in a subfolder).
   Framework preset auto-detects as **Next.js**; build command `next build`, output handled automatically.
4. Deploy. You get a `*.vercel.app` URL to verify.

## Option B — Vercel CLI (no GitHub needed)

From this folder, run (type these yourself — they need an interactive login):
```
! npm i -g vercel
! cd website && vercel        # first run links the project + logs you in
! cd website && vercel --prod # production deploy
```

## Connect the domain (UniSentinel.com — DNS at GoDaddy)

1. In the Vercel project → **Settings → Domains**, add both:
   - `unisentinel.com`
   - `www.unisentinel.com`
   Vercel will show the **exact records to add** — use those if they differ from below.
2. In **GoDaddy → Domain → DNS**, add/edit:

   | Type  | Name | Value                     | TTL  |
   |-------|------|---------------------------|------|
   | A     | `@`  | `76.76.21.21`             | 600  |
   | CNAME | `www`| `cname.vercel-dns.com`    | 600  |

   (Remove any conflicting GoDaddy "Forwarding" or parked A records on `@`.)
3. Back in Vercel, the domains flip to **Valid** within a few minutes to an hour, and HTTPS
   is issued automatically. Set `www` to redirect to the apex (or vice-versa) in Vercel's domain UI.

### Alternative: Vercel nameservers (simplest if you don't need GoDaddy DNS)
In GoDaddy → **Nameservers**, switch to **Custom** and enter the two `ns#.vercel-dns.com`
nameservers Vercel shows. Vercel then manages all DNS for the domain.

## Notes
- Update `metadataBase` / sitemap / robots host in code if you launch on a different domain.
- `outputFileTracingRoot` is pinned in `next.config.ts` because this app sits next to the
  design-system repo's lockfile — leave it set.
