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
    database        = string
    host            = string
    password        = string
    port            = number
    scheme          = string
    user            = string
    caching_disabled = optional(bool, false)
  }))
  description = "Hyperdrive configurations for Cloudflare. caching_disabled (default false = caching on) toggles Hyperdrive's response cache per config."
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
    enabled   = optional(bool, true)    # create the domain active (false = provision disabled)
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
    name                   = string
    jurisdiction           = optional(string, null)
    primary_location_hint  = optional(string, null)
    read_replication_mode  = optional(string, "disabled")
  }))
  description = "D1 databases to create. read_replication_mode defaults to disabled; set to enable read replication per database."
}

# Cloudflare Pages projects. With `source`, Cloudflare builds+deploys on push (no GitHub
# Actions); a functions/ dir deploys a Pages Functions Worker wired to bindings via
# deployment_configs. Authorize the GitHub/GitLab app on the account once first.
variable "pages_projects" {
  type = map(object({
    production_branch = string
    source = optional(object({
      type = string
      config = optional(object({
        owner                          = optional(string)
        repo_name                      = optional(string)
        deployments_enabled            = optional(bool)
        production_deployments_enabled = optional(bool)
        preview_deployment_setting     = optional(string)
        preview_branch_includes        = optional(list(string))
        preview_branch_excludes        = optional(list(string))
        pr_comments_enabled            = optional(bool)
        path_includes                  = optional(list(string))
        path_excludes                  = optional(list(string))
      }))
    }))
    build_config = optional(object({
      build_command   = optional(string)
      root_dir        = optional(string)
      destination_dir = optional(string)
      build_caching   = optional(bool)
    }))
    # Pages Functions = an edge Worker; per bounded-context-transport-agnostic the
    # frontend opens NO database connection, so only edge-legit bindings are exposed
    # (env, kv, r2, services). Extend for d1/hyperdrive/durable-objects only if a
    # product genuinely breaks that boundary.
    deployment_configs = optional(object({
      production = optional(object({
        compatibility_date  = optional(string)
        compatibility_flags = optional(list(string))
        env_vars            = optional(map(object({ type = string, value = string })))
        kv_namespaces       = optional(map(object({ namespace_id = string })))
        r2_buckets          = optional(map(object({ name = string, jurisdiction = optional(string) })))
        services            = optional(map(object({ service = string, environment = optional(string), entrypoint = optional(string) })))
      }))
      preview = optional(object({
        compatibility_date  = optional(string)
        compatibility_flags = optional(list(string))
        env_vars            = optional(map(object({ type = string, value = string })))
        kv_namespaces       = optional(map(object({ namespace_id = string })))
        r2_buckets          = optional(map(object({ name = string, jurisdiction = optional(string) })))
        services            = optional(map(object({ service = string, environment = optional(string), entrypoint = optional(string) })))
      }))
    }))
    custom_domains = optional(list(string), [])
  }))
  default     = {}
  description = "Map of logical_key => Pages project. `source` connects a github/gitlab repo (Cloudflare builds on push); `deployment_configs` wires Pages Functions bindings; `custom_domains` -> cloudflare_pages_domain."
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

variable "ai_gateway_settings" {
  type = object({
    cache_invalidate_on_update = optional(bool, true)
    cache_ttl                  = optional(number, 0)
    collect_logs               = optional(bool, true)
    rate_limiting_interval     = optional(number, 0)
    rate_limiting_limit        = optional(number, 0)
    rate_limiting_technique    = optional(string, "fixed")
    authentication             = optional(bool, false)
  })
  default     = {}
  description = "Settings applied to every AI Gateway (var.ai_gateways names them; this configures them). All optional; defaults = no cache, collect logs, no rate-limit, no auth - override per product."
}

variable "ai_gateway_run_permission_group_id" {
  type        = string
  default     = ""
  description = "Cloudflare 'AI Gateway Run' permission-group id. When set, a scoped API token is created for the cf-aig-authorization header (Unified Billing); empty skips it."
}
