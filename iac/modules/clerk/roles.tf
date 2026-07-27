# Backend API. `permissions` holds logical handles into var.permissions; resolved to
# permission ids here. Referenced by role sets (role-sets.tf) by logical handle.
resource "clerk_organization_role" "this" {
  for_each = var.roles

  key         = each.value.key
  name        = each.value.name
  description = each.value.description
  permissions = [for handle in each.value.permissions : clerk_organization_permission.this[handle].id]
}
