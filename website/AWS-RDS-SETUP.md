# AWS RDS (PostgreSQL) — step-by-step setup

End-to-end guide from creating an AWS account to a live production database wired into the
UniSentinel app. The app connects with the `pg` driver over TLS using `DATABASE_URL`
(see `lib/db/index.ts`).

> **Console UIs drift.** Field names/positions may differ slightly from what's written here;
> the concepts (engine, instance size, networking, credentials, TLS) are stable.

---

## 0. Before you start — cost & the one hard decision

- **Cost:** a `db.t4g.micro` with 20 GB gp3 storage is ~**$15–30/month** (free for 12 months
  under the AWS Free Tier: 750 hrs/month of a micro instance + 20 GB). RDS Proxy and backups
  add a little. Set a **Billing budget alert** (step 1) so there are no surprises.
- **The hard decision — how does Vercel reach RDS?** Vercel serverless functions run *outside*
  your AWS VPC and (on non-Enterprise plans) have **no static outbound IPs**. That leaves three
  realistic options:
  1. **Public RDS, locked down by TLS + strong credentials** (simplest). You must still put a
     security-group rule in front; since Vercel IPs aren't fixed, this often means a wide CIDR,
     so TLS + a strong password are doing the real work. OK to start, least ideal long-term.
  2. **RDS Proxy** (recommended) — connection pooling for serverless; still needs a network path
     from Vercel.
  3. **Move compute into AWS** (e.g. run the app on a platform inside the VPC), or use Vercel
     Enterprise "secure compute" with a static egress you can allow-list.
  This guide uses **option 1 to get running**, then adds **RDS Proxy** (step 9). Decide based on
  your security posture — for customer PII + license keys, aim for 2 or 3.

---

## 1. Create an AWS account (registration)

1. Go to **https://aws.amazon.com** → **Create an AWS Account**.
2. Enter email, account name, and a strong root password.
3. Choose account type (Personal or Business), enter contact details.
4. Add a **payment method** (credit/debit card; required even for Free Tier).
5. **Verify identity** by phone/SMS.
6. Choose a **Support plan** → **Basic (free)** is fine.
7. Sign in to the **AWS Management Console** as the root user.
8. **Immediately harden the account:**
   - Enable **MFA on the root user** (IAM → Security credentials → MFA).
   - Create an **IAM admin user** for day-to-day work and stop using root (IAM → Users →
     Create user → attach `AdministratorAccess` → sign in with that user going forward).
   - **Billing → Budgets → Create budget** → set a monthly cost budget + email alert.

---

## 2. Pick a region

Top-right of the console, choose a **region** close to your users (e.g. `us-east-1`,
`eu-west-1`). Everything below (RDS, security group, proxy) must live in the **same region**.

---

## 3. Create the RDS PostgreSQL instance

1. Console → search **RDS** → **Databases** → **Create database**.
2. **Create method:** *Standard create*.
3. **Engine:** *PostgreSQL*. **Version:** a recent 16.x.
4. **Templates:** *Free tier* (or *Production* if you want Multi-AZ + more resources).
5. **Settings:**
   - **DB instance identifier:** `unisentinel`
   - **Master username:** `postgres` (or your own)
   - **Master password:** set a long random password and **save it in a password manager**.
6. **Instance configuration:** *Burstable classes* → `db.t4g.micro` (Free Tier eligible).
7. **Storage:** *gp3*, 20 GB. Leave autoscaling on (optional).
8. **Connectivity:**
   - **Compute resource:** *Don't connect to an EC2 compute resource*.
   - **VPC:** default VPC is fine to start.
   - **Public access:** **Yes** (needed for option 1 so Vercel/your laptop can connect; set to
     **No** if you'll only ever connect from inside the VPC / via a proxy in the VPC).
   - **VPC security group:** *Create new* → name it `unisentinel-db-sg`.
   - **Database port:** `5432`.
9. **Additional configuration** (expand):
   - **Initial database name:** `unisentinel`  ← important; otherwise no DB is created.
   - **Backups:** enable automated backups, set a retention (e.g. 7 days).
   - **Encryption:** leave **encryption at rest** enabled (default; uses KMS).
10. **Create database.** Wait ~5–10 min until **Status: Available**.

---

## 4. Open the security group to your clients

RDS → your DB → **Connectivity & security** → click the **VPC security group** → **Inbound
rules** → **Edit inbound rules** → **Add rule**:

- **Type:** PostgreSQL, **Port:** 5432.
- **Source:**
  - For running the seed scripts from your machine: **My IP**.
  - For Vercel (option 1): Vercel has no fixed IPs, so this is the weak spot. Pragmatic choices:
    add `0.0.0.0/0` **only while relying on TLS + a strong password**, or better, move to
    **RDS Proxy** (step 9) / private networking. Prefer restricting as much as you can.

---

## 5. Grab the connection details

RDS → your DB → **Connectivity & security**:
- **Endpoint** (e.g. `unisentinel.abcdef123.us-east-1.rds.amazonaws.com`)
- **Port** `5432`

Your connection string:
```
postgres://postgres:<password>@<endpoint>:5432/unisentinel
```

---

## 6. Get the RDS TLS CA bundle

RDS enforces TLS. To *verify* the server certificate (recommended for PII/license keys),
download the global CA bundle:
```
https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```
You'll pass its contents as `DATABASE_CA_CERT`. (Without it the connection is still encrypted
but the cert isn't verified.)

---

## 7. Create the schema + demo data in RDS

From your machine, pointing at RDS (TLS on by default):
```bash
cd website
export DATABASE_URL="postgres://postgres:<password>@<endpoint>:5432/unisentinel"
# verified TLS (recommended):
export DATABASE_CA_CERT="$(cat /path/to/global-bundle.pem)"

node scripts/db-push.mjs     # create users + CRM tables
node scripts/db-seed.mjs     # optional: demo admin (admin@unisentinel.com / UniSentinel!2026)
node scripts/crm-seed.mjs    # optional: demo CRM data
```
If your security-group **My IP** rule is set and credentials are right, these print success.

---

## 8. Wire env vars into Vercel

Vercel → project **uni-sentinel** → **Settings → Environment Variables** (Production; add to
Preview too if wanted):

| Name | Value |
|---|---|
| `DATABASE_URL` | `postgres://…rds.amazonaws.com:5432/unisentinel` (or the RDS Proxy endpoint from step 9) |
| `DATABASE_CA_CERT` | contents of `global-bundle.pem` (paste the PEM) |
| `AUTH_SECRET` | `openssl rand -base64 32` |

Then **redeploy** (push a commit or trigger a redeploy). `unisentinel.com/login` and `/app`
now use RDS.

---

## 9. (Recommended) RDS Proxy — safe serverless connections

Serverless functions open many short-lived connections; RDS Proxy pools them so RDS doesn't hit
`max_connections`.

1. **Store the DB credentials in Secrets Manager:** Console → **Secrets Manager** → **Store a
   new secret** → *Credentials for RDS database* → pick the `unisentinel` DB → save.
2. **Create the proxy:** RDS → **Proxies** → **Create proxy**:
   - Engine family: **PostgreSQL**
   - Target: your `unisentinel` DB
   - **Require Transport Layer Security:** on
   - Secret: the one from step 1
   - IAM role: let it create one
   - Same VPC/subnets/security group as the DB
3. When it's **Available**, copy the **Proxy endpoint** and set `DATABASE_URL` (step 8) to it
   instead of the raw RDS endpoint. Keep `DATABASE_POOL_MAX` small (e.g. 1–5).

---

## 10. Verify & operate

- **Verify:** log in at `/login` with the demo admin; the app reads/writes RDS.
- **Backups:** confirm automated backups + retention (step 3.9). Consider a manual snapshot
  before big migrations.
- **Monitoring:** RDS → Monitoring (CloudWatch) for CPU, connections, storage; set an alarm on
  free storage + connection count.
- **Secrets hygiene:** never commit `.env`; rotate the DB password periodically (Secrets Manager
  can automate rotation). Plan to **encrypt license keys at the app layer** on top of RDS
  encryption-at-rest.

---

## Quick reference — env vars

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (RDS or RDS Proxy endpoint) |
| `DATABASE_CA_CERT` | RDS CA bundle PEM → verified TLS |
| `DATABASE_SSL` | set to `false` only for local plaintext Postgres |
| `DATABASE_POOL_MAX` | max pool connections per instance (small on serverless) |
| `AUTH_SECRET` | session-cookie signing secret |
