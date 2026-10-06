terraform {
  backend "s3" {
    use_lockfile = true
  }
}

module "cloudflare" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//cloudflare?ref=v2.0.1"

  project_name = var.project_name
  account_id   = var.cloudflare_account_id
  api_token    = var.cloudflare_api_token
  api_key      = var.cloudflare_api_key
  email        = var.cloudflare_email

  r2_buckets        = var.cloudflare_r2_buckets
  r2_custom_domains = var.cloudflare_r2_custom_domains
  queues            = var.cloudflare_queues
  kv_namespaces     = var.cloudflare_kv_namespaces
  dns_records       = var.cloudflare_dns_records
  d1_databases      = var.cloudflare_d1_databases
  pages_projects    = var.cloudflare_pages_projects

  r2_bucket_cors_rules = var.cloudflare_r2_bucket_cors_rules
}
