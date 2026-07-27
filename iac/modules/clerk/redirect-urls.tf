# Backend API. Allowlisted redirect URLs, instance-scoped.
resource "clerk_redirect_url" "this" {
  for_each = toset(var.redirect_urls)
  url      = each.value
}
