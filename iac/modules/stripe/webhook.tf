# ─── Webhook Endpoint ────────────────────────────────────────────────────────

resource "stripe_webhook_endpoint" "billing" {
  url         = var.webhook_url
  api_version = var.stripe_api_version

  enabled_events = var.webhook_enabled_events

  description = "${var.project_name} billing webhook (${terraform.workspace})"

  metadata = {
    environment = terraform.workspace
    managed_by  = "terraform"
  }
}
