terraform {
  backend "s3" {
    use_lockfile = true
  }
}

module "neon" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//neon?ref=v1.0.3"

  project_name              = var.project_name
  api_key                   = var.neon_api_key
  org_id                    = var.neon_org_id
  region_id                 = var.neon_region_id
  pg_version                = var.neon_pg_version
  history_retention_seconds = var.neon_history_retention_seconds
  databases                 = var.neon_databases
}

module "cloudflare" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//cloudflare?ref=v1.0.3"

  project_name = var.project_name
  account_id   = var.cloudflare_account_id
  api_token    = var.cloudflare_api_token

  # Wire Neon outputs → Cloudflare Hyperdrive configs
  hyperdrive_configs = {
    for key, database_name in var.neon_databases : key => {
      database = database_name
      host     = module.neon.database_host
      port     = 5432
      user     = module.neon.database_roles[key].name
      password = module.neon.database_roles[key].password
      scheme   = "postgres"
    }
  }

  r2_buckets              = var.cloudflare_r2_buckets
  queues                  = var.cloudflare_queues
  kv_namespaces           = var.cloudflare_kv_namespaces
  origin_connection_limit = var.cloudflare_origin_connection_limit
  dns_records             = var.cloudflare_dns_records
  d1_databases            = var.cloudflare_d1_databases
  pages_projects          = var.cloudflare_pages_projects
}

module "google_main" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//google?ref=v1.0.3"

  project_id            = var.gcp_main_project_id
  region                = var.gcp_region
  credentials_file_path = var.gcp_main_credentials_file_path
  app_display_name      = "Ui-sdk"
}

# module "google_admin" {
#   source = "git::https://github.com/zeroxsolutions/tf-modules.git//google?ref=v1.0.3"

#   project_id            = var.gcp_admin_project_id
#   region                = var.gcp_region
#   credentials_file_path = var.gcp_admin_credentials_file_path
#   app_display_name      = "Ui-sdk Admin"
# }

module "clerk" {
  source = "git::https://github.com/zeroxsolutions/tf-modules.git//clerk?ref=v1.0.3"

  api_key          = var.clerk_api_key
  platform_api_key = var.clerk_platform_api_key

  applications         = var.clerk_applications
  application_settings = var.clerk_application_settings
  redirect_urls        = var.clerk_redirect_urls
  jwt_templates        = var.clerk_jwt_templates

  organizations = var.clerk_organizations
  permissions   = var.clerk_permissions
  roles         = var.clerk_roles
  role_sets     = var.clerk_role_sets
}
