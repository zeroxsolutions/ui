# ─── Subscription Products & Prices ──────────────────────────────────────────

resource "stripe_product" "subscription" {
  for_each = { for k, v in var.plans : k => v if v.price_in_cents > 0 }

  name        = "${var.project_name} ${title(each.key)} Plan"
  description = "${title(each.key)} subscription — ${each.value.monthly_credits} credits/month"
  active      = true

  metadata = {
    plan_id         = each.key
    monthly_credits = tostring(each.value.monthly_credits)
    managed_by      = "terraform"
  }
}

resource "stripe_price" "subscription" {
  for_each = stripe_product.subscription

  product     = each.value.id
  currency    = "usd"
  unit_amount = var.plans[each.key].price_in_cents

  recurring {
    interval       = "month"
    interval_count = 1
  }

  metadata = {
    plan_id    = each.key
    managed_by = "terraform"
  }
}

# ─── Credit Pack Products & Prices ──────────────────────────────────────────

resource "stripe_product" "credit_pack" {
  for_each = { for pack in var.credit_packs : pack.id => pack }

  name        = "${var.project_name} ${each.value.label}"
  description = "${each.value.credits} AI credits"
  active      = true

  metadata = {
    pack_id    = each.key
    credits    = tostring(each.value.credits)
    managed_by = "terraform"
  }
}

resource "stripe_price" "credit_pack" {
  for_each = stripe_product.credit_pack

  product     = each.value.id
  currency    = "usd"
  unit_amount = { for pack in var.credit_packs : pack.id => pack.price_in_cents }[each.key]

  metadata = {
    pack_id    = each.key
    managed_by = "terraform"
  }
}
