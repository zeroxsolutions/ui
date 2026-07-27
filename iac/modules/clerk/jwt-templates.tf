# Backend API. JWT templates; `claims` is a JSON string.
resource "clerk_jwt_template" "this" {
  for_each = var.jwt_templates

  name               = each.key
  claims             = each.value.claims
  lifetime           = each.value.lifetime
  allowed_clock_skew = each.value.allowed_clock_skew
  signing_algorithm  = each.value.signing_algorithm
}
