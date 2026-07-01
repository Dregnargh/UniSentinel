output "db_endpoint" {
  description = "RDS instance endpoint hostname."
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "Database port."
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name."
  value       = aws_db_instance.main.db_name
}

output "secret_arn" {
  description = "Secrets Manager ARN holding the master credentials."
  value       = aws_secretsmanager_secret.db.arn
}

output "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint (only when enable_rds_proxy = true)."
  value       = var.enable_rds_proxy ? aws_db_proxy.main[0].endpoint : null
}

# Full connection string. Sensitive because it embeds the generated password.
# Read it with:  terraform output -raw database_url
output "database_url" {
  description = "Postgres connection string for DATABASE_URL."
  value       = "postgres://${var.master_username}:${random_password.master.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
  sensitive   = true
}
