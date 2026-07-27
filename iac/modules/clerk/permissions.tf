# Backend API. Organization permission = a capability key (org:classes:manage).
# Referenced by roles (roles.tf) by logical handle.
resource "clerk_organization_permission" "this" {
  for_each = var.permissions

  key         = each.value.key
  name        = each.value.name
  description = each.value.description
}
