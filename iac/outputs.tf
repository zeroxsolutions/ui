# Cloudflare binding ids/names — consumed by each worker's wrangler.jsonc (non-secret).
output "hyperdrive_config_ids" {
  value = module.cloudflare.hyperdrive_config_ids
}

# Direct Neon connection URLs per service database — DDL/migrations only (drizzle-kit),
# BYPASS Hyperdrive (migration-direct-not-pooled). Sensitive (role passwords); write into the
# gitignored root .env via: terraform output -json neon_database_urls | jq ... > ../.env
output "neon_database_urls" {
  sensitive = true
  value = {
    for key, db in var.neon_databases :
    key => "postgres://${module.neon.database_roles[key].name}:${module.neon.database_roles[key].password}@${module.neon.database_host}/${db}?sslmode=require"
  }
}

output "r2_bucket_names" {
  value = module.cloudflare.r2_bucket_names
}

# Pages projects - subdomain (<name>.pages.dev) + domains. With `source` set, Cloudflare
# builds+deploys the repo (Pages Functions = a Worker) on push; no GitHub Actions.
output "cloudflare_pages_projects" {
  value = module.cloudflare.pages_projects
}

output "queue_ids" {
  value = module.cloudflare.queue_ids
}

# KV / D1 / AI Gateway binding ids - consumed by workers' wrangler.jsonc. Were
# module-only before; surfaced at root so `terraform output` gives them directly.
output "cloudflare_kv_namespace_ids" {
  value = module.cloudflare.kv_namespace_ids
}

output "cloudflare_d1_database_ids" {
  value = module.cloudflare.d1_database_ids
}

output "cloudflare_ai_gateways" {
  value = module.cloudflare.ai_gateways
}

output "web_app_firebase_config" {
  value     = module.google_main.firebase_config
  sensitive = true
}

output "web_app_firebase_admin_key" {
  value     = module.google_main.firebase_admin_service_account_key
  sensitive = true
}

# Back-office (admin) Firebase is deferred — re-enable alongside the
# `google_admin` module in main.tf once its credentials are provisioned.
# output "back_office_firebase_config" {
#   value     = module.google_admin.firebase_config
#   sensitive = true
# }

# output "back_office_firebase_admin_key" {
#   value     = module.google_admin.firebase_admin_service_account_key
#   sensitive = true
# }

# Clerk (auth alternative to Firebase). Per-application `applications` holds the
# instance secret keys (sensitive) the gateway verifies tokens with
# (auth-verify-server-side); write them to wrangler secrets. `publishable_keys` are
# client-facing (SPA). Leave at empty defaults when a product uses Firebase instead.
output "clerk_applications" {
  value     = module.clerk.applications
  sensitive = true
}

output "clerk_publishable_keys" {
  value = module.clerk.publishable_keys
}

output "clerk_domains" {
  value = module.clerk.domains
}

# Clerk organizations + RBAC (non-secret identifiers). Org ids feed the gateway's
# tenant context (mw-scope-in-path-actor-in-command); role keys back the RBAC gate
# (mw-single-global-gate-per-route-rbac).
output "clerk_organizations" {
  value = module.clerk.organizations
}

output "clerk_permissions" {
  value = module.clerk.permissions
}

output "clerk_roles" {
  value = module.clerk.roles
}

output "clerk_redirect_urls" {
  value = module.clerk.redirect_urls
}

output "clerk_jwt_templates" {
  value = module.clerk.jwt_templates
}

output "clerk_organization_domains" {
  value = module.clerk.organization_domains
}

output "clerk_instance_configs" {
  value = module.clerk.instance_configs
}

output "clerk_role_sets" {
  value = module.clerk.role_sets
}
