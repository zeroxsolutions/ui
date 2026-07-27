## Auth - both keys optional so Clerk is an opt-in alternative to the google/Firebase module.
variable "api_key" {
  type        = string
  sensitive   = true
  default     = null
  description = "Clerk instance secret key (sk_test_/sk_live_); drives Backend API resources. Leave null when Clerk is unused."
}

variable "platform_api_key" {
  type        = string
  sensitive   = true
  default     = null
  description = "Clerk Platform API key (ak_); drives Platform API resources (beta). Leave null when Clerk is unused."
}

## Per-domain applications (Platform API). One clerk_application per map entry; each
## fans out its own clerk_domain custom domains. This is the "responsive per domain"
## extension point - add/remove apps in tfvars, the module code stays stable
## (iac-modules-extend-not-rewrite).
variable "applications" {
  type = map(object({
    name              = string
    domain            = optional(string) # primary domain, create-only
    environment_types = optional(list(string), ["development", "production"])
    proxy_path        = optional(string)
    template          = optional(string)
    logo_path         = optional(string)
    favicon_path      = optional(string)
    domains = optional(list(object({ # additional clerk_domain resources
      name       = string
      proxy_path = optional(string) # per-domain proxy path, create-only
    })), [])
    instance_config = optional(object({
      environment = optional(string, "production") # which of environment_types to bind
      config      = string                         # JSON string of instance config
    }))
  }))
  default     = {}
  description = "Map of logical_key => Clerk application. `domain` is the primary domain at creation (create-only); each `domains` entry provisions an additional clerk_domain. `instance_config` (when set) binds a clerk_instance_config to the application's instance matching `environment` (default production)."
}

## Instance-level config (Backend API); scoped to the instance of `api_key`.
variable "application_settings" {
  type = object({
    enable_organizations    = bool
    admin_delete_enabled    = optional(bool)
    domains_enabled         = optional(bool)
    max_allowed_memberships = optional(number)
  })
  default     = null
  description = "Singleton instance organization settings (Backend API, scoped to the instance of `api_key` - NOT to Platform-created applications; use applications.instance_config for those). null = don't manage."
}

variable "redirect_urls" {
  type        = list(string)
  default     = []
  description = "Allowlisted redirect URLs (Backend API, instance-scoped)."
}

variable "jwt_templates" {
  type = map(object({
    claims             = string
    lifetime           = optional(number)
    allowed_clock_skew = optional(number)
    signing_algorithm  = optional(string)
  }))
  default     = {}
  description = "Map of name => JWT template. `claims` is a JSON string."
}

## Organizations + RBAC (Backend API) - instance-scoped to `api_key`.
variable "organizations" {
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
  description = "Map of logical_key => organization. Each seeds a clerk_organization, a clerk_organization_domain per `domains` entry, and a clerk_organization_membership per `members` entry."
}

variable "permissions" {
  type = map(object({
    key         = string
    name        = string
    description = optional(string)
  }))
  default     = {}
  description = "Map of logical_key => organization permission (RBAC capability, e.g. key `org:classes:manage`)."
}

variable "roles" {
  type = map(object({
    key         = string
    name        = string
    description = optional(string)
    permissions = optional(list(string), []) # logical handles into `permissions`
  }))
  default     = {}
  description = "Map of logical_key => organization role. `permissions` lists logical handles from `var.permissions`; the module resolves them to permission ids."
}

variable "role_sets" {
  type = map(object({
    key          = string
    name         = string
    description  = optional(string)
    default_role = string       # logical handle into `roles`
    creator_role = string       # logical handle into `roles`
    roles        = list(string) # logical handles into `roles`
  }))
  default     = {}
  description = "Map of logical_key => role set. `default_role` / `creator_role` / `roles` are logical handles from `var.roles`; the module resolves them to role keys."
}
