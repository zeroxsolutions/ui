## Common
variable "project_name" {
  type        = string
  description = "The name of the project"
  nullable    = false
}

## Cloudflare
variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID"
  nullable    = false
}

variable "cloudflare_api_token" {
  type        = string
  description = "API token for Cloudflare provider"
  sensitive   = true
  nullable    = false
}

variable "cloudflare_r2_buckets" {
  type        = list(string)
  description = "Logical R2 bucket names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_r2_custom_domains" {
  type = list(object({
    bucket    = string
    domain    = string
    zone_name = string
    min_tls   = optional(string, "1.2")
    enabled   = optional(bool, true)
  }))
  description = "Public custom domains attached to R2 buckets. `bucket` is a logical name that must also appear in cloudflare_r2_buckets; `zone_name` is the Cloudflare zone the hostname belongs to. The Cloudflare API provisions the proxied CNAME itself, so no cloudflare_dns_records entry is needed."
  default     = []
}

variable "cloudflare_queues" {
  type        = list(string)
  description = "Logical Queue names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_kv_namespaces" {
  type        = list(string)
  description = "Logical KV namespace names - prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_dns_records" {
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

variable "cloudflare_d1_databases" {
  type = list(object({
    name                  = string
    jurisdiction          = optional(string, null)
    primary_location_hint = optional(string, null)
  }))
  description = "D1 databases to create"
  default     = []
}

variable "cloudflare_pages_projects" {
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
  description = "Map of logical_key => Cloudflare Pages project. `source` connects a github/gitlab repo (Cloudflare builds+deploys on push, no GitHub Actions); deployment_configs wires Pages Functions bindings; custom_domains -> cloudflare_pages_domain. Authorize the GitHub/GitLab app on the account once first."
}
