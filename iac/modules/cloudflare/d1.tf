resource "cloudflare_d1_database" "databases" {
  account_id = var.account_id
  for_each   = { for db in var.d1_databases : db.name => db }
  name       = "${var.project_name}-${each.value.name}-${terraform.workspace}"

  jurisdiction          = each.value.jurisdiction
  primary_location_hint = each.value.primary_location_hint

  read_replication = {
    mode = each.value.read_replication_mode
  }
}
