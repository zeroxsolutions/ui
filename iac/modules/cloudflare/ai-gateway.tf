# AI Gateways (native cloudflare_ai_gateway resource). Each logical name becomes a
# `{project}-{name}-{workspace}` gateway for caching, rate-limiting, analytics, and
# BYOK routing to Anthropic/Google/OpenAI/Workers-AI. Defaults mirror the prior
# curl-based shape (no cache, collect logs, no rate-limit, no auth); spend_limits,
# cache_ttl, rate_limiting, authentication, dlp, guardrails, logpush, etc. are all
# native fields now - extend here per gateway when a product needs them.
resource "cloudflare_ai_gateway" "main" {
  for_each = toset(var.ai_gateways)

  account_id                 = var.account_id
  id                         = "${var.project_name}-${each.value}-${terraform.workspace}"
  cache_invalidate_on_update = var.ai_gateway_settings.cache_invalidate_on_update
  cache_ttl                  = var.ai_gateway_settings.cache_ttl
  collect_logs               = var.ai_gateway_settings.collect_logs
  rate_limiting_interval     = var.ai_gateway_settings.rate_limiting_interval
  rate_limiting_limit        = var.ai_gateway_settings.rate_limiting_limit
  rate_limiting_technique    = var.ai_gateway_settings.rate_limiting_technique
  authentication             = var.ai_gateway_settings.authentication
}

# -- Unified Billing: cf-aig-authorization token --------------------------------
# Partner models (Anthropic/OpenAI/Google/xAI) are billed to Cloudflare credits with
# no provider key; the api worker sends `cf-aig-authorization: Bearer <tok>` to the
# gateway's /compat endpoint. That bearer is a Cloudflare API token scoped to "AI
# Gateway Run". Created here only when the permission-group id is supplied (look it
# up once in the dashboard) - output ai_gateway_run_token feeds the worker secret
# CF_AIG_TOKEN.
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
