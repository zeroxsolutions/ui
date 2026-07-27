# Backend API. One membership per (organization, member) pair - nested for_each over
# each org's `members` list. References the organization in organizations.tf.
resource "clerk_organization_membership" "this" {
  for_each = {
    for pair in flatten([
      for org_key, org in var.organizations : [
        for member in org.members : { org_key = org_key, member = member }
      ]
    ]) : "${pair.org_key}/${pair.member.user_id}" => pair
  }

  organization_id = clerk_organization.this[each.value.org_key].id
  user_id         = each.value.member.user_id
  role            = each.value.member.role
}
