# The Cloudflare Realtime (Calls) SFU app that carries the room audio/video (the media engine behind the
# rooms Room Durable Object signaling). Terraform-managed per `iac-terraform-root` - created only through
# `apply`, never dashboard-clicked. Its identifier (`uid`) feeds the PUBLIC `REALTIME_APP_ID` var in
# rooms-service `wrangler.jsonc`; its `secret` (sensitive) is the SFU control-API Bearer, set as the
# `REALTIME_APP_SECRET` wrangler secret - never in `vars`, never committed (`secrets-and-logging`).
# Namespaced by `terraform.workspace` so development and production get their own app.
resource "cloudflare_calls_sfu_app" "rooms" {
  account_id = var.account_id
  name       = "${var.project_name}-rooms-${terraform.workspace}"
}
