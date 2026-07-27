resource "cloudflare_workers_kv_namespace" "mcp_oauth_kv" {
  account_id = var.account_id
  title      = "${var.project_name}-mcp-oauth-kv-${terraform.workspace}"
}
