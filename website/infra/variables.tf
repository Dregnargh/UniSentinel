variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-north-1" # Europe (Stockholm)
}

variable "db_identifier" {
  description = "RDS instance identifier."
  type        = string
  default     = "unisentinel"
}

variable "db_name" {
  description = "Initial database name created inside the instance."
  type        = string
  default     = "unisentinel"
}

variable "master_username" {
  description = "Master (admin) username for Postgres."
  type        = string
  default     = "postgres"
}

variable "instance_class" {
  description = "RDS instance class. db.t4g.micro is Free-Tier eligible in most regions."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB."
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "PostgreSQL major (or major.minor) version."
  type        = string
  default     = "16"
}

variable "publicly_accessible" {
  description = "Whether the DB gets a public endpoint. Needed if you connect from outside the VPC (your laptop, Vercel). Set false once compute is in-VPC."
  type        = bool
  default     = true
}

variable "allowed_cidrs" {
  description = "CIDR blocks allowed to reach Postgres on 5432. Add your own IP as x.x.x.x/32 to run the seed scripts. Avoid 0.0.0.0/0."
  type        = list(string)
  default     = []
}

variable "backup_retention_days" {
  description = "Automated backup retention in days."
  type        = number
  default     = 7
}

variable "multi_az" {
  description = "Deploy a standby in another AZ (higher availability, ~2x cost)."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Block accidental deletion. Turn on for production."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip the final snapshot on destroy. Set false for production."
  type        = bool
  default     = true
}

variable "enable_rds_proxy" {
  description = "Create an RDS Proxy for pooled connections. Only useful when your app connects from inside the VPC."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    Project = "UniSentinel"
    Managed = "terraform"
  }
}
