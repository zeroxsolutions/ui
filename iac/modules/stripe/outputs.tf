# ─── Outputs ─────────────────────────────────────────────────────────────────

output "webhook_secret" {
  value     = stripe_webhook_endpoint.billing.secret
  sensitive = true
}

output "subscription_prices" {
  value = {
    for key, price in stripe_price.subscription : key => {
      product_id = stripe_product.subscription[key].id
      price_id   = price.id
    }
  }
}

output "credit_pack_prices" {
  value = {
    for key, price in stripe_price.credit_pack : key => {
      product_id = stripe_product.credit_pack[key].id
      price_id   = price.id
    }
  }
}
