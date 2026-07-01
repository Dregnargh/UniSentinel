# -----------------------------------------------------------------------------
# UniSentinel — PostgreSQL on AWS RDS (eu-north-1 by default).
# Uses the account's default VPC + subnets to keep the footprint small. The
# master password is generated and stored in Secrets Manager — you never type
# or paste it. TLS is enforced (rds.force_ssl) and storage is encrypted.
# -----------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# --- Credentials -------------------------------------------------------------

resource "random_password" "master" {
  length  = 24
  special = true
  # Restrict to unreserved URL chars so the password drops into a connection
  # string without percent-encoding (avoids @ : / # % ? etc.).
  override_special = "-_"
}

resource "aws_secretsmanager_secret" "db" {
  name        = "${var.db_identifier}/master-credentials"
  description = "Master credentials for the ${var.db_identifier} RDS instance."
  tags        = var.tags
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master.result
    engine   = "postgres"
    port     = 5432
    dbname   = var.db_name
    host     = aws_db_instance.main.address
  })
}

# --- Networking --------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "${var.db_identifier}-subnets"
  subnet_ids = data.aws_subnets.default.ids
  tags       = var.tags
}

resource "aws_security_group" "db" {
  name        = "${var.db_identifier}-db-sg"
  description = "Access to the ${var.db_identifier} Postgres instance."
  vpc_id      = data.aws_vpc.default.id
  tags        = var.tags
}

# Client access (your IP / allow-listed CIDRs) to Postgres.
resource "aws_vpc_security_group_ingress_rule" "postgres" {
  for_each          = toset(var.allowed_cidrs)
  security_group_id = aws_security_group.db.id
  description       = "Postgres from ${each.value}"
  cidr_ipv4         = each.value
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
}

# Allow the security group to reach itself on 5432 (needed for RDS Proxy -> DB).
resource "aws_vpc_security_group_ingress_rule" "self" {
  count                        = var.enable_rds_proxy ? 1 : 0
  security_group_id            = aws_security_group.db.id
  description                  = "Intra-SG Postgres (RDS Proxy -> DB)"
  referenced_security_group_id = aws_security_group.db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.db.id
  description       = "All outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# --- Parameter group: enforce TLS -------------------------------------------

resource "aws_db_parameter_group" "main" {
  name        = "${var.db_identifier}-pg16"
  family      = "postgres16"
  description = "UniSentinel Postgres 16 params (force SSL)."
  tags        = var.tags

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# --- The database ------------------------------------------------------------

resource "aws_db_instance" "main" {
  identifier     = var.db_identifier
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.master_username
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = var.publicly_accessible
  parameter_group_name   = aws_db_parameter_group.main.name
  port                   = 5432

  backup_retention_period    = var.backup_retention_days
  multi_az                   = var.multi_az
  auto_minor_version_upgrade = true
  apply_immediately          = true

  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.db_identifier}-final"

  tags = var.tags
}

# --- Optional: RDS Proxy (pooled connections for in-VPC compute) -------------

data "aws_iam_policy_document" "proxy_assume" {
  count = var.enable_rds_proxy ? 1 : 0
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "proxy" {
  count              = var.enable_rds_proxy ? 1 : 0
  name               = "${var.db_identifier}-proxy-role"
  assume_role_policy = data.aws_iam_policy_document.proxy_assume[0].json
  tags               = var.tags
}

data "aws_iam_policy_document" "proxy" {
  count = var.enable_rds_proxy ? 1 : 0
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.db.arn]
  }
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "proxy" {
  count  = var.enable_rds_proxy ? 1 : 0
  name   = "${var.db_identifier}-proxy-policy"
  role   = aws_iam_role.proxy[0].id
  policy = data.aws_iam_policy_document.proxy[0].json
}

resource "aws_db_proxy" "main" {
  count                  = var.enable_rds_proxy ? 1 : 0
  name                   = "${var.db_identifier}-proxy"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.proxy[0].arn
  vpc_subnet_ids         = data.aws_subnets.default.ids
  vpc_security_group_ids = [aws_security_group.db.id]
  require_tls            = true

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.db.arn
  }

  tags = var.tags
}

resource "aws_db_proxy_default_target_group" "main" {
  count         = var.enable_rds_proxy ? 1 : 0
  db_proxy_name = aws_db_proxy.main[0].name
}

resource "aws_db_proxy_target" "main" {
  count                  = var.enable_rds_proxy ? 1 : 0
  db_proxy_name          = aws_db_proxy.main[0].name
  target_group_name      = aws_db_proxy_default_target_group.main[0].name
  db_instance_identifier = aws_db_instance.main.identifier
}
