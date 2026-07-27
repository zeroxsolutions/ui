variable "project_name" {
  type        = string
  description = "The name of the project"
  nullable    = false
}

variable "account_id" {
  type        = string
  description = "Cloudflare Account ID"
  nullable    = false
}

variable "api_token" {
  type        = string
  description = "API token for Cloudflare provider"
  nullable    = false
  sensitive   = true
}

variable "hyperdrive_configs" {
  type = map(object({
    database = string
    host     = string
    password = string
    port     = number
    scheme   = string
    user     = string
  }))
  description = "Hyperdrive configurations for Cloudflare"
}

variable "r2_buckets" {
  type        = list(string)
  description = "Logical R2 bucket names - prefixed with project+workspace at creation"
}

variable "r2_custom_domains" {
  type = list(object({
    bucket    = string                  # logical bucket name (must also be in r2_buckets)
    domain    = string                  # public hostname serving the bucket over HTTPS
    zone_name = string                  # Cloudflare zone the hostname belongs to
    min_tls   = optional(string, "1.2") # 1.0 | 1.1 | 1.2 | 1.3
  }))
  default     = []
  description = "Public custom domains attached to R2 buckets - Cloudflare-proxied HTTPS access to bucket objects (e.g. the desktop auto-update feed)."
}

variable "queues" {
  type        = list(string)
  description = "Logical Queue names - prefixed with project+workspace at creation"
}

variable "kv_namespaces" {
  type        = list(string)
  description = "Logical KV namespace names - prefixed with project+workspace at creation"
  default     = []
}

variable "origin_connection_limit" {
  type        = number
  description = "Max simultaneous connections to Hyperdrive origin"
  default     = 60
}

variable "dns_records" {
  type = list(object({
    zone_id = string
    type    = string
    content = string
    name    = string
    ttl     = optional(number, 1)
    comment = optional(string, null)
    proxied = optional(bool, true)
  }))
  description = "DNS records to create"
  default     = []
}

variable "d1_databases" {
  type = list(object({
    name                  = string
    jurisdiction          = optional(string, null)
    primary_location_hint = optional(string, null)
  }))
  description = "D1 databases to create"
}

variable "vectorize_indexes" {
  type = list(object({
    name       = string
    dimensions = number
    metric     = string # cosine | euclidean | dot-product
  }))
  default     = []
  description = "Vectorize indexes - managed via wrangler CLI (provider lacks native resource)"
}

variable "ai_gateways" {
  type        = list(string)
  default     = []
  description = "AI Gateway logical names - each becomes `{project}-{name}-{workspace}` slug for caching, rate-limit, analytics, BYOK routing to Anthropic/Google/OpenAI/Workers-AI"
}

variable "ai_gateway_run_permission_group_id" {
  type        = string
  default     = ""
  description = "Cloudflare 'AI Gateway Run' permission-group id. When set, a scoped API token is created for the cf-aig-authorization header (Unified Billing); empty skips it."
}
