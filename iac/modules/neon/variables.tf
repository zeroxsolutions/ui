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
  description = "History retention period in seconds"
  default     = 0
}

variable "databases" {
  type        = map(string)
  description = "Map of logical_key => postgres_database_name"
  nullable    = false
}
