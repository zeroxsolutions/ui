resource "cloudflare_dns_record" "app" {
  for_each = { for r in var.dns_records : "${r.zone_id}-${r.name}" => r }
  zone_id  = each.value.zone_id
  name     = each.value.name
  type     = each.value.type
  content  = each.value.content
  ttl      = each.value.ttl
  comment  = each.value.comment
  proxied  = each.value.proxied
}
