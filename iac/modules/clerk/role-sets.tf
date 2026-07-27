# Backend API. `default_role` / `creator_role` / `roles` are logical handles into
# var.roles; resolved to role keys here.
resource "clerk_role_set" "this" {
  for_each = var.role_sets

  key              = each.value.key
  name             = each.value.name
  description      = each.value.description
  default_role_key = clerk_organization_role.this[each.value.default_role].key
  creator_role_key = clerk_organization_role.this[each.value.creator_role].key
  roles            = [for handle in each.value.roles : clerk_organization_role.this[handle].key]
}
