resource "cloudflare_r2_bucket" "main" {
  for_each   = toset(var.r2_buckets)
  account_id = var.account_id
  name       = "${var.project_name}-${each.value}-${terraform.workspace}"
}
