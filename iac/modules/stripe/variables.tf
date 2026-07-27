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

variable "plans" {
  type = map(object({
    monthly_credits = number
    price_in_cents  = number
  }))
  description = "Subscription plans: key = plan name (free/pro/enterprise)"
}

variable "credit_packs" {
  type = list(object({
    id             = string
    credits        = number
    price_in_cents = number
    label          = string
  }))
  description = "One-time credit packs"
}
