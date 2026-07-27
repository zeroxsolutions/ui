# Prices. currency is data-driven per plan/pack (defaults to usd). A subscription
# price is recurring (monthly); a credit-pack price is one-time.

resource "stripe_price" "subscription" {
  for_each = stripe_product.subscription

  product     = each.value.id
  currency    = var.plans[each.key].currency
  unit_amount = var.plans[each.key].price_in_cents

  recurring {
    interval       = var.plans[each.key].interval
    interval_count = var.plans[each.key].interval_count
  }

  metadata = {
    plan_id    = each.key
    managed_by = "terraform"
  }
}

resource "stripe_price" "credit_pack" {
  for_each = stripe_product.credit_pack

  product     = each.value.id
  currency    = var.credit_packs[each.key].currency
  unit_amount = var.credit_packs[each.key].price_in_cents

  metadata = {
    pack_id    = each.key
    managed_by = "terraform"
  }
}
