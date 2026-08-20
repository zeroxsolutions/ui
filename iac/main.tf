terraform {
  backend "s3" {
    use_lockfile = true
  }
}

module "cloudflare" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//cloudflare?ref=v1.0.3"

  project_name = var.project_name
  account_id   = var.cloudflare_account_id
  api_token    = var.cloudflare_api_token

  r2_buckets        = var.cloudflare_r2_buckets
  r2_custom_domains = var.cloudflare_r2_custom_domains
  queues            = var.cloudflare_queues
  kv_namespaces     = var.cloudflare_kv_namespaces
  dns_records       = var.cloudflare_dns_records
  d1_databases      = var.cloudflare_d1_databases
  pages_projects    = var.cloudflare_pages_projects

  # The module declares hyperdrive_configs without a default, so it must be passed.
  # This root has no database layer to point one at - the Neon module that fed it
  # belonged to a different product.
  hyperdrive_configs = {}
}
