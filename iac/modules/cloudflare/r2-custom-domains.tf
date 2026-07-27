# Public custom domains for R2 buckets. Connecting a custom domain makes the
# Cloudflare API provision the proxied CNAME in the named zone, so no separate
# cloudflare_dns_record is needed. The zone id is resolved from the zone name.
data "cloudflare_zone" "r2_custom_domain" {
  for_each = { for d in var.r2_custom_domains : d.domain => d }
  filter = {
    name = each.value.zone_name
  }
}

resource "cloudflare_r2_custom_domain" "main" {
  for_each    = { for d in var.r2_custom_domains : d.domain => d }
  account_id  = var.account_id
  bucket_name = "${var.project_name}-${each.value.bucket}-${terraform.workspace}"
  domain      = each.value.domain
  zone_id     = data.cloudflare_zone.r2_custom_domain[each.key].id
  enabled     = each.value.enabled
  min_tls     = each.value.min_tls
  depends_on  = [cloudflare_r2_bucket.main]
}
