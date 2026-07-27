# Platform API. `prevent_destroy` because deleting a Clerk application orphans its
# users and keys irreversibly (iac-modules-extend-not-rewrite).
resource "clerk_application" "this" {
  for_each = var.applications

  name              = each.value.name
  domain            = each.value.domain
  environment_types = each.value.environment_types
  proxy_path        = each.value.proxy_path
  template          = each.value.template
  logo              = each.value.logo_path != null ? filebase64(each.value.logo_path) : null
  favicon           = each.value.favicon_path != null ? filebase64(each.value.favicon_path) : null

  lifecycle {
    prevent_destroy = true
  }
}
