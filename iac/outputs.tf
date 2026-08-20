output "r2_bucket_names" {
  value = module.cloudflare.r2_bucket_names
}

# Public HTTPS origin per R2 custom domain, keyed by hostname. This is the base URL an
# app points its asset resolver at.
output "r2_custom_domains" {
  value = module.cloudflare.r2_custom_domains
}

output "queue_ids" {
  value = module.cloudflare.queue_ids
}

# KV / D1 binding ids - consumed by a worker's wrangler.jsonc when one exists.
output "cloudflare_kv_namespace_ids" {
  value = module.cloudflare.kv_namespace_ids
}

output "cloudflare_d1_database_ids" {
  value = module.cloudflare.d1_database_ids
}

# Pages projects - subdomain (<name>.pages.dev) + domains. With `source` set, Cloudflare
# builds and deploys the repo on push; no GitHub Actions.
output "cloudflare_pages_projects" {
  value = module.cloudflare.pages_projects
}
