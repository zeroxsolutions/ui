# Backend API (instance-scoped to `api_key`). Seeds organizations (tenants).
resource "clerk_organization" "this" {
  for_each = var.organizations

  name                    = each.value.name
  slug                    = each.value.slug
  max_allowed_memberships = each.value.max_allowed_memberships
  admin_delete_enabled    = each.value.admin_delete_enabled
  created_by              = each.value.created_by
  public_metadata         = each.value.public_metadata
  private_metadata        = each.value.private_metadata
}
