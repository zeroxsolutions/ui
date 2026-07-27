resource "cloudflare_queue" "main" {
  for_each   = toset(var.queues)
  account_id = var.account_id
  queue_name = "${var.project_name}-${each.value}-${terraform.workspace}"
}
