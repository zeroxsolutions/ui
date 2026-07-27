# Products. name/description are data-driven from var.plans / var.credit_packs
# (no fabricated display strings) so a product can be localized per market.

resource "stripe_product" "subscription" {
  for_each = { for k, v in var.plans : k => v if v.price_in_cents > 0 }

  name        = each.value.name
  description = each.value.description
  active      = true

  metadata = {
    plan_id         = each.key
    monthly_credits = tostring(each.value.monthly_credits)
    managed_by      = "terraform"
  }
}

resource "stripe_product" "credit_pack" {
  for_each = var.credit_packs

  name        = each.value.label
  description = each.value.description
  active      = true

  metadata = {
    pack_id    = each.key
    credits    = tostring(each.value.credits)
    managed_by = "terraform"
  }
}
