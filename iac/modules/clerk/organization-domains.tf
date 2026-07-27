# Backend API. One domain per (organization, domain) pair - nested for_each over
# each org's `domains` list. References the organization in organizations.tf.
resource "clerk_organization_domain" "this" {
  for_each = {
    for pair in flatten([
      for org_key, org in var.organizations : [
        for domain in org.domains : { org_key = org_key, domain = domain }
      ]
    ]) : "${pair.org_key}/${pair.domain.name}" => pair
  }

  organization_id = clerk_organization.this[each.value.org_key].id
  name            = each.value.domain.name
  enrollment_mode = each.value.domain.enrollment_mode
  verified        = each.value.domain.verified
}
