# AI Gateways.
# The Cloudflare Terraform provider v5.18 has no native AI Gateway resource,
# so creation is shelled out to the REST API (wrangler also lacks an
# ai-gateway subcommand). State holds only the input trigger - CF is the
# source of truth for gateway existence.
#
# Requires the cloudflare_api_token to have account-level `AI Gateway` edit
# permission; otherwise POST returns 401 "Authentication error" and the
# resource is marked tainted (HTTP status is surfaced, not swallowed).

locals {
  ai_gateway_slugs = {
    for name in var.ai_gateways :
    name => "${var.project_name}-${name}-${terraform.workspace}"
  }
}

resource "terraform_data" "ai_gateways" {
  for_each = local.ai_gateway_slugs

  input = {
    name       = each.key
    slug       = each.value
    account_id = var.account_id
    api_token  = var.api_token
  }

  # Idempotent create: 200/201 = new, 409 = already exists. Any other status
  # (401/403 bad token, 400 malformed body) fails the provisioner.
  provisioner "local-exec" {
    command = <<-EOT
      set -eu
      out=$(mktemp)
      resp=$(curl -sS -o "$out" -w '%%{http_code}' -X POST \
        "https://api.cloudflare.com/client/v4/accounts/${self.input.account_id}/ai-gateway/gateways" \
        -H "Authorization: Bearer ${self.input.api_token}" \
        -H "Content-Type: application/json" \
        -d '{"id":"${self.input.slug}","cache_invalidate_on_update":true,"cache_ttl":0,"collect_logs":true,"rate_limiting_interval":0,"rate_limiting_limit":0,"rate_limiting_technique":"fixed","authentication":false}')
      if [ "$resp" = "200" ] || [ "$resp" = "201" ]; then
        echo "Created AI Gateway ${self.input.slug}"
      elif [ "$resp" = "409" ]; then
        echo "AI Gateway ${self.input.slug} already exists"
      else
        echo "Failed to create AI Gateway (HTTP $resp):"
        cat "$out"
        rm -f "$out"
        exit 1
      fi
      rm -f "$out"
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      set -eu
      out=$(mktemp)
      resp=$(curl -sS -o "$out" -w '%%{http_code}' -X DELETE \
        "https://api.cloudflare.com/client/v4/accounts/${self.input.account_id}/ai-gateway/gateways/${self.input.slug}" \
        -H "Authorization: Bearer ${self.input.api_token}")
      if [ "$resp" = "200" ] || [ "$resp" = "204" ] || [ "$resp" = "404" ]; then
        echo "Deleted AI Gateway ${self.input.slug} (or already gone)"
      else
        echo "Failed to delete AI Gateway (HTTP $resp):"
        cat "$out"
        rm -f "$out"
        exit 1
      fi
      rm -f "$out"
    EOT
  }
}

# -- Unified Billing: cf-aig-authorization token --------------------------------
# Partner models (Anthropic/OpenAI/Google/xAI) are billed to Cloudflare credits
# with no provider key; the api worker sends `cf-aig-authorization: Bearer <tok>`
# to the gateway's /compat endpoint. That bearer is a Cloudflare API token scoped
# to "AI Gateway Run". Created here only when the permission-group id is supplied
# (look it up once in the dashboard) - output feeds the worker secret CF_AIG_TOKEN.
#
# Spend cap ($50/mo): Cloudflare does not publish a REST/TF field for AI Gateway
# spend limits, so set it in the dashboard (AI Gateway -> Settings -> Spend,
# account-level) alongside loading credits. Recorded here so the intent is
# explicit; wire to TF once the API is published.
resource "cloudflare_api_token" "ai_gateway_run" {
  count = var.ai_gateway_run_permission_group_id == "" ? 0 : 1
  name  = "${var.project_name}-ai-gateway-run-${terraform.workspace}"

  policies = [{
    effect            = "allow"
    permission_groups = [{ id = var.ai_gateway_run_permission_group_id }]
    resources = {
      "com.cloudflare.api.account.${var.account_id}" = "*"
    }
  }]
}
