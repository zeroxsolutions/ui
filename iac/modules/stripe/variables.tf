variable "api_key" {
  type      = string
  sensitive = true
}

variable "project_name" {
  type = string
}

variable "webhook_url" {
  type        = string
  description = "The URL for the Stripe webhook endpoint (e.g., https://api.zeroxsolutions.com/v1/billing/webhooks/stripe)"
}

variable "stripe_api_version" {
  type        = string
  description = "Stripe API version (Stripe-Version) the webhook signs events with. MUST match the backend Stripe SDK's pinned version so event shapes line up; defaults to the current Stripe version - check your account's pinned version in the Stripe dashboard and align."
  default     = "2026-06-24.dahlia"
}

variable "webhook_enabled_events" {
  type        = list(string)
  description = "Stripe events the billing webhook endpoint subscribes to."
  default = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
  ]
}

variable "plans" {
  type = map(object({
    name            = string
    description     = string
    monthly_credits = number
    price_in_cents  = number
    currency        = optional(string, "usd")
    interval        = optional(string, "month")
    interval_count  = optional(number, 1)
  }))
  description = "Subscription plans keyed by plan id (free/pro/enterprise). name/description are the Stripe product display strings (localize per market); currency defaults to usd; price_in_cents > 0 creates the Stripe product+price recurring at interval x interval_count (both default monthly), = 0 is a free plan (no Stripe resource)."
}

variable "credit_packs" {
  type = map(object({
    label          = string
    description    = string
    credits        = number
    price_in_cents = number
    currency       = optional(string, "usd")
  }))
  description = "One-time credit packs keyed by pack id. label/description are the Stripe product display strings (localize per market); currency defaults to usd."
}
