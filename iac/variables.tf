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
  nullable    = false
}

variable "cloudflare_r2_buckets" {
  type        = list(string)
  description = "Logical R2 bucket names — prefixed with project+workspace at creation"
}

variable "cloudflare_queues" {
  type        = list(string)
  description = "Logical Queue names — prefixed with project+workspace at creation"
}

variable "cloudflare_kv_namespaces" {
  type        = list(string)
  description = "Logical KV namespace names — prefixed with project+workspace at creation"
  default     = []
}

variable "cloudflare_origin_connection_limit" {
  type        = number
  description = "Max simultaneous connections to Hyperdrive origin"
  default     = 60
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

## Neon
variable "neon_api_key" {
  type        = string
  description = "API key for Neon provider"
  nullable    = false
}

variable "neon_org_id" {
  type        = string
  description = "Organization ID for Neon projects"
  nullable    = false
}

variable "neon_region_id" {
  type        = string
  description = "Region ID for the Neon project"
  default     = "aws-ap-southeast-1"
}

variable "neon_pg_version" {
  type        = number
  description = "PostgreSQL version for the Neon project"
  default     = 17
}

variable "neon_history_retention_seconds" {
  type        = number
  description = "History retention period in seconds"
  default     = 0
}

variable "neon_databases" {
  type        = map(string)
  description = "Map of logical_key => postgres_database_name"
  nullable    = false
}

## Google / Firebase — Main app (Firebase project 1)
variable "gcp_main_project_id" {
  type        = string
  description = "GCP project ID for the main Firebase app (end-user auth)"
  nullable    = false
}

variable "gcp_region" {
  type        = string
  description = "GCP region"
  default     = "asia-southeast1"
}

variable "gcp_main_credentials_file_path" {
  type        = string
  description = "Path to GCP service account JSON for main Firebase project"
  nullable    = false
}

## Google / Firebase — Admin app (Firebase project 2)
variable "gcp_admin_project_id" {
  type        = string
  description = "GCP project ID for the admin Firebase app (back-office auth)"
  nullable    = false
}

variable "gcp_admin_credentials_file_path" {
  type        = string
  description = "Path to GCP service account JSON for admin Firebase project"
  nullable    = false
}

## Clerk - auth provider alternative to Firebase (opt-in: leave at defaults when unused).
## Keys are optional so a Firebase product pays no Clerk cost; fill them only when a
## product verifies tokens through Clerk (auth-verify-server-side). Put real keys in the
## gitignored *.tfvars, never committed (tf-state-and-secrets).
variable "clerk_api_key" {
  type        = string
  sensitive   = true
  default     = null
  description = "Clerk instance secret key (sk_test_/sk_live_). null when Clerk is unused."
}

variable "clerk_platform_api_key" {
  type        = string
  sensitive   = true
  default     = null
  description = "Clerk Platform API key (ak_, beta). null when Clerk is unused."
}

variable "clerk_applications" {
  type = map(object({
    name              = string
    domain            = optional(string)
    environment_types = optional(list(string), ["development", "production"])
    proxy_path        = optional(string)
    template          = optional(string)
    logo_path         = optional(string)
    favicon_path      = optional(string)
    domains = optional(list(object({
      name       = string
      proxy_path = optional(string)
    })), [])
    instance_config = optional(object({
      environment = optional(string, "production")
      config      = string
    }))
  }))
  default     = {}
  description = "Map of logical_key => Clerk application (Platform API). `domain` is the primary domain at creation (create-only); each `domains` entry provisions an additional clerk_domain; `instance_config` binds a clerk_instance_config to the application's instance matching `environment`."
}

variable "clerk_application_settings" {
  type = object({
    enable_organizations    = bool
    admin_delete_enabled    = optional(bool)
    domains_enabled         = optional(bool)
    max_allowed_memberships = optional(number)
  })
  default     = null
  description = "Singleton instance organization settings (Backend API, scoped to the instance of clerk_api_key - NOT Platform-created applications). null = don't manage."
}

variable "clerk_redirect_urls" {
  type        = list(string)
  default     = []
  description = "Allowlisted redirect URLs (Backend API, instance-scoped)."
}

variable "clerk_jwt_templates" {
  type = map(object({
    claims             = string
    lifetime           = optional(number)
    allowed_clock_skew = optional(number)
    signing_algorithm  = optional(string)
  }))
  default     = {}
  description = "Map of name => JWT template. `claims` is a JSON string."
}

variable "clerk_organizations" {
  type = map(object({
    name                    = string
    slug                    = optional(string)
    max_allowed_memberships = optional(number)
    admin_delete_enabled    = optional(bool)
    created_by              = optional(string)
    public_metadata         = optional(string)
    private_metadata        = optional(string)
    domains = optional(list(object({
      name            = string
      enrollment_mode = optional(string)
      verified        = optional(bool)
    })), [])
    members = optional(list(object({
      user_id = string
      role    = string
    })), [])
  }))
  default     = {}
  description = "Map of logical_key => Clerk organization (Backend API). Seeds org + domains + memberships."
}

variable "clerk_permissions" {
  type = map(object({
    key         = string
    name        = string
    description = optional(string)
  }))
  default     = {}
  description = "Map of logical_key => organization permission (RBAC capability)."
}

variable "clerk_roles" {
  type = map(object({
    key         = string
    name        = string
    description = optional(string)
    permissions = optional(list(string), [])
  }))
  default     = {}
  description = "Map of logical_key => organization role. `permissions` are logical handles from clerk_permissions."
}

variable "clerk_role_sets" {
  type = map(object({
    key          = string
    name         = string
    description  = optional(string)
    default_role = string
    creator_role = string
    roles        = list(string)
  }))
  default     = {}
  description = "Map of logical_key => role set. `default_role` / `creator_role` / `roles` are logical handles from clerk_roles."
}
