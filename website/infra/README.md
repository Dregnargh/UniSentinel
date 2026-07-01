# UniSentinel infra — RDS PostgreSQL (Terraform)

Provisions PostgreSQL on AWS RDS in `eu-north-1`, using your account's default VPC:

- RDS Postgres 16 (`db.t4g.micro`, gp3, **encrypted at rest**)
- **TLS enforced** (`rds.force_ssl = 1`)
- Master password **auto-generated** and stored in **Secrets Manager** (you never type it)
- Security group scoped to CIDRs you allow-list
- Optional **RDS Proxy** (`enable_rds_proxy = true`) for pooled connections

You run this with **your own AWS credentials** — the password and state never pass through
anyone else. State can contain the generated password, so `.gitignore` here excludes
`*.tfstate` and `terraform.tfvars`.

## Prerequisites

- Terraform >= 1.5 and AWS credentials. Two easy options:
  - **AWS CloudShell** (bottom-left of the console — already authenticated as you). Install
    Terraform there, or
  - **Local:** `aws configure` with an IAM user's keys, then run Terraform on your machine.

## Run

```bash
cd website/infra
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set allowed_cidrs to your IP  (curl -s https://checkip.amazonaws.com)

terraform init
terraform plan          # review what will be created
terraform apply         # type 'yes' to create the DB (~5-10 min)
```

## After apply — get connection details & seed

```bash
terraform output -raw database_url          # -> DATABASE_URL for the app
terraform output secret_arn                 # credentials in Secrets Manager
```

The seed scripts only need `pg` + `bcryptjs`, so install just those — do **not** run the full
`npm install` in AWS CloudShell (the website's 3D deps exceed CloudShell's 1 GB home → `ENOSPC`).
Also don't export the RDS CA into an env var here (the global bundle is large enough to trigger
`Argument list too long`); TLS is still on, just unverified, which is fine for a one-time seed.
The verified CA belongs on the app runtime (Vercel), not this shell.

```bash
mkdir -p /tmp/seed && cd /tmp/seed
cp <repo>/website/scripts/db-push.mjs <repo>/website/scripts/db-seed.mjs <repo>/website/scripts/crm-seed.mjs .
npm init -y >/dev/null && npm install --cache /tmp/npmcache pg bcryptjs
export DATABASE_URL="$(cd <repo>/website/infra && terraform output -raw database_url)"
node db-push.mjs && node db-seed.mjs && node crm-seed.mjs
```

Then set `DATABASE_URL`, `DATABASE_CA_CERT`, and `AUTH_SECRET` in Vercel and redeploy
(see `../AWS-RDS-SETUP.md`). For Vercel prefer the smaller region CA bundle
`https://truststore.pki.rds.amazonaws.com/eu-north-1/eu-north-1-bundle.pem`.

## Tear down

```bash
terraform destroy
```

## AWS Free plan note

If your account is on the AWS **Free plan**, `terraform apply` fails the RDS instance with
`FreeTierRestrictionError: ... backup retention period exceeds the maximum`. Set
`backup_retention_days = 0` in `terraform.tfvars` and re-apply. Raise it back to `7` after you
upgrade to a paid plan (backups matter for production data).

## Production hardening (edit terraform.tfvars)

- `deletion_protection = true`, `skip_final_snapshot = false`
- `multi_az = true` for high availability
- Tighten `allowed_cidrs`; prefer in-VPC compute + `enable_rds_proxy = true` and
  `publicly_accessible = false`
- Enable Secrets Manager rotation on the master credentials
