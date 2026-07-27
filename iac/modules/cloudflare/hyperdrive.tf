resource "cloudflare_hyperdrive_config" "main" {
  for_each   = var.hyperdrive_configs
  account_id = var.account_id
  name       = "${var.project_name}-${each.key}-${terraform.workspace}"

  origin = {
    host     = each.value.host
    port     = each.value.port
    user     = each.value.user
    password = each.value.password
    database = each.value.database
    scheme   = each.value.scheme
  }

  origin_connection_limit = var.origin_connection_limit

  caching = {
    disabled = false
  }
}
