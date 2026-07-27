# ─── Webhook Endpoint ────────────────────────────────────────────────────────

resource "stripe_webhook_endpoint" "billing" {
  url = var.webhook_url

  enabled_events = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
  ]

  description = "${var.project_name} billing webhook (${terraform.workspace})"

  metadata = {
    environment = terraform.workspace
    managed_by  = "terraform"
  }
}
