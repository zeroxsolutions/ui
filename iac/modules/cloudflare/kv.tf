resource "cloudflare_workers_kv_namespace" "main" {
  for_each   = toset(var.kv_namespaces)
  account_id = var.account_id
  title      = "${var.project_name}-${each.value}-${terraform.workspace}"
}
