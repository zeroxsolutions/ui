variable "project_name" {
  type        = string
  description = "The name of the project"
  nullable    = false
}

variable "api_key" {
  type        = string
  description = "API key for Neon provider"
  nullable    = false
}

variable "org_id" {
  type        = string
  description = "Organization ID for Neon projects"
  nullable    = false
}

variable "region_id" {
  type        = string
  description = "Region ID for the Neon project"
  default     = "aws-ap-southeast-1"
}

variable "pg_version" {
  type        = number
  description = "PostgreSQL version for the Neon project"
  default     = 17
}

variable "history_retention_seconds" {
  type        = number
  description = "Neon WAL history retention in seconds - enables point-in-time restore (PITR). 0 (default) DISABLES PITR: no time-travel restore, no extra storage. Set to 604800 (7 days) to opt into PITR; Neon bills for retained history, so the scaffold default stays 0 - choose deliberately per product."
  default     = 0
}

variable "databases" {
  type        = map(string)
  description = "Map of logical_key => postgres_database_name"
  nullable    = false
}

variable "branch_name" {
  type        = string
  description = "Name of the Neon project's default branch."
  default     = "main"
}

variable "default_branch_protected" {
  type        = bool
  description = "Protect the default branch from deletion (Neon branch protection)."
  default     = true
}
